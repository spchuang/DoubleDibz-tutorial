from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from ..post_comments import PostComment, PostCommentTagging, PostCommentForm
from ..posts import Post
from .. import response as Response
from ..users import UserFacebookAccount
from ..fb_helpers import get_fb_graph_from_app, send_tag_fb_notifications
from ..notifications import UserPostSubscribe, update_object_notifications, POST, POST_COMMENT


post_comments = Blueprint('post_comments', __name__, url_prefix='/api/posts')
   
@post_comments.route('/<int:id>/comments', methods=['GET'])
def get_post_comments(id):
   if not Post.exists_by_id(id):
      abort(404, "The post is unavailable")
   
   comments = PostComment.by_post_id(id)
   return Response.make_data_resp(data=[i.to_json(user=current_user) for i in comments]) 

@post_comments.route('/<int:id>/comments', methods=['POST'])
@login_required
def add_post_comment(id):
   form = PostCommentForm() 
   if form.validate_on_submit():
      post = Post.by_id(id)
      if not post:
         abort(404, "The post is unavailable")
         
      comment = PostComment()
      form.populate_obj(comment)
      comment.user_id = current_user.id
      try:
         comment.user_id = current_user.id
         comment.post_id = id
         post.add_comment(comment)
         db.session.add(comment)
         db.session.commit()
         
         #subscribe user if not already subscribed
         subscriber = UserPostSubscribe.by_subscriber_and_post(current_user.id, post.id)
         if not subscriber:
            subscriber = UserPostSubscribe(subscriber_id=current_user.id, post_id=post.id)
            db.session.add(subscriber) 
            db.session.commit()    
               
         send_tag_fb_notifications(current_user.id, form.fb_ids, post)
         update_object_notifications.delay(post.id, POST, current_user.id, POST_COMMENT)
                  
      except Exception as e:
         return Response.make_exception_resp(exception=e)
         
      return Response.make_data_resp(data=comment.to_json(user=current_user),  msg="You have successfully added a comment!")
   
   return Response.make_form_error_resp(form=form)

@post_comments.route('/<int:id>/comments/<int:c_id>', methods=['PUT'])
@login_required
def update_post_comment(id, c_id):
   form = PostCommentForm() 
   if form.validate_on_submit():
      post = Post.by_id(id)
      if not post:
         abort(404, "The post is unavailable")
         
      comment = PostComment.by_user_and_id(current_user, c_id)
      if not comment:
         abort(404, "This comment is unavailable or doesn't belong to you")
         
      try:
         form.populate_obj(comment)
         db.session.commit()
         send_tag_fb_notifications(current_user.id, form.fb_ids, post)
        
      except Exception as e:
         return Response.make_exception_resp(exception=e)
         
      return Response.make_data_resp(data=comment.to_json(user=current_user),  msg="You have successfully edited a comment!")
   
   return Response.make_form_error_resp(form=form)
   
@post_comments.route('/<int:id>/comments/<int:c_id>', methods=['DELETE'])
@login_required
def delete_post_comment(id, c_id):
   comment = PostComment.by_user_and_id(current_user, c_id)
   if not comment:
      abort(404, "This comment is unavailable or doesn't belong to you")
         
   try:
      db.session.delete(comment)
      db.session.commit()
      
      #TODO: delete comment notifications (decrement count) in future maybe
   except Exception as e:
      return Response.make_exception_resp(exception=e)
         
   return Response.make_success_resp(msg="You have deleted the comment!") 
   