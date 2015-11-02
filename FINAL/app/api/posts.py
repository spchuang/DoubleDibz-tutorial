from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from celery import chain
from .. import response as Response

from ..posts import SellingPost, PostBookmark, SellingPostForm, updateStatusForm, updateSubscribeStatusForm, MAX_IMG_PER_POST, ACTIVE, INACTIVE, get_new_and_del_images, Post
from ..hashtags import Hashtag
from ..images import Image, save_images_to_s3, delete_image
from ..users import User
from ..circles import Circle
from ..search import Search, init_filters
from ..notifications import UserPostSubscribe, update_object_notifications, change_subscriptions, POST_EDIT, POST_DELETE, POST_STATUS_INACTIVE, POST_STATUS_ACTIVE, POST, USER, SUBSCRIBED, UNSUBSCRIBED
from ..cache import post_cache as cache

posts = Blueprint('posts', __name__, url_prefix='/api/posts')

'''
   Api 
'''

@posts.route('/<int:id>', methods=['GET'])
#@login_required
def get_post(id):
   post = SellingPost.by_id(id)
   if not post:
      abort(404, "The post is unavailable")
      
   if current_user.is_authenticated():
      data = post.to_json(user=current_user, get_bookmarks=True)
   else:
      data = post.to_json(user=None)
   
   return Response.make_data_resp(data=data)
   
@posts.route('', methods=['POST'])
@login_required
def create_post():
   '''create a new post. Return status code 422 if there is error in form data. Return new post data upon success'''
   form = SellingPostForm()
   
   if form.validate_on_submit():
      try:    
      
         #Check if user is member of ucla group
         circle = Circle.by_name("ucla")
         if not current_user.is_member(circle):
            return Response.make_error_resp(msg="You can only post if you are a member of the ucla group")
      
         hashtags, error = Hashtag.validate_hashtags(form.hashtags.data)
         if error:
            return Response.make_form_error_resp(form=form, msg=error['msg']) 
  
         #get images to add
         tmp_images = Image.tmp_by_user(current_user)
         error, new_images, del_images = get_new_and_del_images(form.images.data, tmp_images, [])
         if error:
            return Response.make_form_error_resp(form=form, msg=error['msg']) 

         del form.images 
         del form.hashtags    
      
         post = SellingPost()
         form.populate_obj(post)
         post.user_id = current_user.id
         
         #save images to post
         post.add_images(new_images)
         
         #set primary image
         post.set_primary_image(form.primary_image_id.data)
         
         #save images to s3
         save_images_to_s3(current_user, new_images)
         
         #add the hashtags to post
         post.add_hashtags_from_list(hashtags)
         circle.add_post(post)
         
         db.session.add(post)
         db.session.commit()
         
         #subscribe self to post
         subscriber = UserPostSubscribe(subscriber_id=current_user.id, post_id=post.id)
         db.session.add(subscriber)
         db.session.commit()
         
      except Exception as e:
         return Response.make_exception_resp(exception=e)
         
      data = post.to_json(user=current_user)
      return Response.make_data_resp(data=data,  msg="You have successfully created a new post!")
   
   return Response.make_form_error_resp(form=form)  

@posts.route('/<int:id>', methods=['PUT'])
@login_required
def update_post(id):
   form = SellingPostForm()

   post = SellingPost.by_user_and_id(current_user, id)
   if not post:
      abort(404, "The post is unavailable or doesn't belong to you")
   
   if form.validate_on_submit():
      try:
         #check hashtags
         hashtags, error = Hashtag.validate_hashtags(form.hashtags.data)
         if error:
            return Response.make_form_error_resp(form=form, msg=error['msg'])    
            
         #get images to add or delete
         tmp_images = Image.tmp_by_user(current_user)
         error, new_images, del_images = get_new_and_del_images(form.images.data, tmp_images, post.images)
         if error:
            return Response.make_form_error_resp(form=form, msg=error['msg']) 
      
         post.add_images(new_images)
         
         #set primary image
         post.set_primary_image(form.primary_image_id.data)
         
         #update post from form
         del form.images 
         del form.hashtags
         del form.primary_image_id
         form.populate_obj(post)
         
         #save new images 
         save_images_to_s3(current_user, new_images)
         
         #delete old images
         for i in del_images:
            delete_image(i)
            db.session.delete(i)
            
         #update the hashtags to post
         post.update_hashtags_from_list(hashtags) 

         db.session.commit()
         update_object_notifications.delay(post.id, POST, current_user.id, POST_EDIT)
      except Exception as e:
         return Response.make_exception_resp(exception=e)
         
      data = post.to_json(user=current_user)
      return Response.make_data_resp(data=data,  msg="You have successfully updated the post!")
   
   return Response.make_form_error_resp(form=form)
      
@posts.route('/<int:id>/status', methods=['PUT'])
@login_required
def update_post_status(id):
   form = updateStatusForm()

   if form.validate_on_submit():
      post = SellingPost.by_user_and_id(current_user, id)
      if not post:
         abort(404, "The post is unavailable or doesn't belong to you")
   
      try:
         post.status_code = form.status_code.data       
         db.session.commit()
         
         if form.status_code.data == INACTIVE:
            (update_object_notifications.si(post.id, POST, current_user.id, POST_STATUS_INACTIVE) | change_subscriptions.si(post.id, POST, UNSUBSCRIBED))()
         elif form.status_code.data == ACTIVE:
            (change_subscriptions.si(post.id, POST, SUBSCRIBED) | update_object_notifications.si(post.id, POST, current_user.id, POST_STATUS_ACTIVE))()
      except Exception as e:
         return Response.make_exception_resp(exception=e)
         
      data = post.to_json(user=current_user)
      return Response.make_data_resp(data=data,  msg="You have updated your post status!")
   
   return Response.make_form_error_resp(form=form)

   

@posts.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_post(id):
   post = SellingPost.by_user_and_id(current_user, id)
   if not post:
      abort(404, "The post is unavailable or doesn't belong to you")
   try:
      #delete all the post images
      for i in post.images:
      
         #delete all s3 images for this post
         delete_image(i)
         db.session.delete(i)

      #remove from bookmarks
      bookmarks = PostBookmark.by_post_id(post.id)
      for i in bookmarks:
         db.session.delete(i)

      update_object_notifications.delay(post.id, POST, current_user.id, POST_DELETE)
      #delete post from cache
      cache.del_post(post.id)
      db.session.delete(post)
      db.session.commit()
      
      
   except Exception as e:
         return Response.make_exception_resp(exception=e)
   return Response.make_success_resp(msg="You have deleted the post!")   

'''
@posts.route('/<int:id>/subscribe', methods=['PUT'])
@login_required
def update_subscribe_status(id):
   form = updateSubscribeStatusForm()
   
   if form.validate_on_submit():
      post = Post.by_id(id)
      if not post:
         abort(404, "The post is unavailable")
   
      try:
         subscriber = UserPostSubscribe.by_subscriber_and_post(current_user.id, post.id)
         if not subscriber:
            subscriber = UserPostSubscribe(subscriber_id=current_user.id, post_id=post.id)
            db.session.add(subscriber)
            
         subscriber.status_code = form.status_code.data        
         db.session.commit()
      except Exception as e:
         return Response.make_exception_resp(exception=e)
      return Response.make_data_resp(data=subscriber.to_json(), msg="You have updated your subscription status for this post!")
   
   return Response.make_form_error_resp(form=form)
'''
