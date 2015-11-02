from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from .. import response as Response
from celery import chain

from ..posts import BuyRequest, BuyRequestForm, updateStatusForm, ACTIVE, INACTIVE
from ..circles import Circle
from ..hashtags import Hashtag
from ..notifications import UserPostSubscribe, update_object_notifications, change_subscriptions, POST_EDIT, POST_DELETE, POST_STATUS_INACTIVE, POST_STATUS_ACTIVE, POST, USER, SUBSCRIBED, UNSUBSCRIBED

buy_requests = Blueprint('buy_requests', __name__, url_prefix='/api/buy_requests')

'''
   Api
'''

@buy_requests.route('', methods=['GET'])
@login_required
#Used for testing now
def get_buy_requests():
   buy_requests = BuyRequest().query.all()
   return Response.make_data_resp(data=[i.to_json(user=current_user) for i in buy_requests])


@buy_requests.route('/<int:id>', methods=['GET'])
#@login_required
def get_buy_request(id):
   buy_request = BuyRequest.by_id(id)
   if not buy_request:
      abort(404, "The buy request is unavailable")
   if current_user.is_authenticated():
      data = buy_request.to_json(user=current_user)
   else:
      data = buy_request.to_json(user=None)
      
   return Response.make_data_resp(data=data)
 
          
@buy_requests.route('', methods=['POST'])
@login_required
def create_buy_request():
   form = BuyRequestForm()
      
   if form.validate_on_submit():
      try: 
         #Check if user is member of ucla group
         circle = Circle.by_name("ucla")
         if not current_user.is_member(circle):
            return Response.make_error_resp(msg="You can only request if you are a member of the ucla group")

         hashtags, error = Hashtag.validate_hashtags(form.hashtags.data)
         if error:
            return Response.make_form_error_resp(form=form, msg=error['msg']) 

         del form.hashtags 

         buy_request = BuyRequest()
         form.populate_obj(buy_request)
         buy_request.user_id = current_user.id

         #add the hashtags to post
         buy_request.add_hashtags_from_list(hashtags)
         circle.add_post(buy_request)

         db.session.add(buy_request)
         db.session.commit()
         
         #subscribe self to buy request
         subscriber = UserPostSubscribe(subscriber_id=current_user.id, post_id=buy_request.id)
         db.session.add(subscriber)
         db.session.commit()
         
      except Exception as e:
         return Response.make_exception_resp(exception=e)
         
      data = buy_request.to_json(user=current_user)
      return Response.make_data_resp(data=data,  msg="You have successfully created a new buy request!")
   
   return Response.make_form_error_resp(form=form)   

@buy_requests.route('/<int:id>', methods=['PUT'])
@login_required
def update_buy_request(id):
   form = BuyRequestForm()

   if form.validate_on_submit():
      buy_request = BuyRequest.by_user_and_id(current_user, id)
      if not buy_request:
         abort(404, "The buy request is unavailable or doesn't belong to you")  
      
      try:
         #check hashtags
         hashtags, error = Hashtag.validate_hashtags(form.hashtags.data)
         if error:
            return Response.make_form_error_resp(form=form, msg=error['msg']) 
            
         #update buy request from form
         del form.hashtags
         
         form.populate_obj(buy_request)
         buy_request.update_hashtags_from_list(hashtags) 
         db.session.commit()
         
         update_object_notifications.delay(buy_request.id, POST, current_user.id, POST_EDIT)
      except Exception as e:
         return Response.make_exception_resp(exception=e)
         
      data = buy_request.to_json(user=current_user)
      return Response.make_data_resp(data=data,  msg="You have successfully updated your buy request!")
   
   return Response.make_form_error_resp(form=form)

       
@buy_requests.route('/<int:id>/status', methods=['PUT'])
@login_required
def update_buy_request_status(id):
   form = updateStatusForm()

   if form.validate_on_submit():
      buy_request = BuyRequest.by_user_and_id(current_user, id)
      if not buy_request:
         abort(404, "The buy request is unavailable or doesn't belong to you")
   
      try:
         buy_request.status_code = form.status_code.data       
         db.session.commit()
         
         if form.status_code.data == INACTIVE:
            (update_object_notifications.si(buy_request.id, POST, current_user.id, POST_STATUS_INACTIVE) | change_subscriptions.si(buy_request.id, POST, UNSUBSCRIBED))()
         elif form.status_code.data == ACTIVE:
            (change_subscriptions.si(buy_request.id, POST, SUBSCRIBED) | update_object_notifications.si(buy_request.id, POST, current_user.id, POST_STATUS_ACTIVE))()
      except Exception as e:
         return Response.make_exception_resp(exception=e)
         
      data = buy_request.to_json(user=current_user)
      return Response.make_data_resp(data=data,  msg="You have updated your buy request status!")
   
   return Response.make_form_error_resp(form=form)


@buy_requests.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_buy_request(id):
   buy_request = BuyRequest.by_user_and_id(current_user, id)
   if not buy_request:
      abort(404, "The buy request is unavailable or doesn't belong to you")
      
   try:
      update_object_notifications.delay(buy_request.id, POST, current_user.id, POST_DELETE)
      
      db.session.delete(buy_request)
      db.session.commit()
   except Exception as e:
         return Response.make_exception_resp(exception=e)
   return Response.make_success_resp(msg="You have deleted the buy request!")