from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from ..chat import Chat, ChatMessage, CreateChatForm, CreateChatMessageForm
from ..posts import Post
from ..circles import Circle

from .. import response as Response
from ..users import UserFacebookAccount
from ..notifications import UserPostSubscribe, contact_seller
from ..fb_helpers import send_chat_fb_notification
from ..cache import inbox_cache as cache

chat = Blueprint('messages', __name__, url_prefix='/api/chat')

@chat.route('', methods=['GET'])
@login_required
def get_list_chat():
   '''
      Get a list of chat for the authenticated user
   '''
   
   data = cache.get_inbox(current_user.id)
   return Response.make_data_resp(data=data)

   
@chat.route('', methods=['POST'])
@login_required
def create_post_chat():
   form = CreateChatForm()
   
   if form.validate_on_submit():
   
      #check if post exists
      post = Post.by_id(form.post_id.data)
      if not post:
         abort(404, "The post is unavailable")
      
      #check if creator is the same as post owner
      if post.user_id == current_user.id:
         return Response.make_error_resp(msg="Can't chat with yourself!", code=409)
      
      #check if user is in same circle as post owner
      user = current_user
      circle = post.joined_circles[0]
      if not user.is_member(circle):
         return Response.make_error_resp(msg="You need to be a member of the group to contact owner!", code=404)
         
      #check if post already has a chat for this user
      if post.has_chat_with_user(current_user):
         return Response.make_error_resp(msg="Chat already exists!", code=409)
      
      try: 
         #invalidate inbox for both ppl
         cache.del_inbox(current_user.id)
         cache.del_inbox(post.user_id)
         
         chat = Chat(contact_user= current_user)
         msg = ChatMessage(body = form.message.data, created_by = current_user.id)
         post.add_chat(chat)
         chat.add_message(msg)
         
         db.session.add(chat)
         db.session.add(msg)
         db.session.commit()
         
         #subscribe user if not already subscribed
         subscriber = UserPostSubscribe.by_subscriber_and_post(current_user.id, post.id)
         if not subscriber:
            subscriber = UserPostSubscribe(subscriber_id=current_user.id, post_id=post.id)
            db.session.add(subscriber) 
            db.session.commit()
         
         #send a fb notification to the user
         send_chat_fb_notification(current_user, post, chat)         
         contact_seller.delay(current_user.id, post.user_id, post.id)   
         
      except Exception as e:
         return Response.make_exception_resp(exception=e)
  
      return Response.make_data_resp(data = chat.to_json(user_id = current_user.id), msg="You have successfully created a chat!")
   return Response.make_form_error_resp(form=form) 

@chat.route('/<int:id>', methods=['GET'])
@login_required
def get_chat(id):

   chat = Chat.by_user_and_id(current_user, id)
   if not chat:
      abort(404, "The chat is unavailable or doesn't belong to you")
     
   #set read status (current_user.read = yes). If it returns true, commit the changes
   if chat.set_self_read(user=current_user):
      try: 
         db.session.add(chat)
         db.session.commit()
         
         #invalidate inbox
         cache.reset_chat(current_user.id, chat)
         
      except Exception as e:
         return Response.make_exception_resp(exception=e)

   return Response.make_data_resp(data=chat.to_json(user_id = current_user.id))   
   
   
@chat.route('/<int:chat_id>', methods=['POST'])
@login_required
def create_chat_message(chat_id):
   form = CreateChatMessageForm()
   
   if form.validate_on_submit():
      #check if chat exists
      chat = Chat.by_user_and_id(current_user, chat_id)
      if not chat:
         abort(404, "The chat is unavailable or doesn't belong to you")
      
      #If the post is deleted, we should not allow messaging
      if not chat.post:
         abort(404, "You can't message anymore because the post is removed!") 
      
      try: 
         msg = ChatMessage(body = form.message.data, created_by = current_user.id)
         chat.add_message(msg)
         
         #set chat read status (chat.other person.read = No)
         chat.set_other_unread(user=current_user)
         chat.updateTime()
         
         #invalidate inbox
         cache.reset_chat(current_user.id, chat)
         
         db.session.add(msg)
         db.session.commit()
         
      except Exception as e:
         return Response.make_exception_resp(exception=e)
      
      return Response.make_data_resp(data = msg.to_json(), msg="message sent!")
      
   
   return Response.make_form_error_resp(form=form) 
   

   
   
   