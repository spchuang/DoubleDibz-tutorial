from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify,make_response )

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh

import os
from .. import response as Response
from ..extensions import db, login_manager
from ..helpers import get_current_time_plus, allowed_image_file

from ..users import User, UserSettings, UserCircleAuth, UserFacebookAccount, SettingsForm, PasswordForm, FirstPasswordForm,AddEmailForm, PasswordRequiredForm
from ..fb_helpers import get_fb_user_from_cookie, get_fb_graph_from_user, get_long_token, get_resize_profile_pic, save_profile_image
from ..emails import Email, EmailAuthAction, send_user_email, VERIFY_EMAIL
from ..circles import Circle
from ..circles.helpers import join_circle, leave_circle, add_user_to_college_if_member
from ..images.forms import ImageForm

account = Blueprint('account', __name__, url_prefix='/api/account')

   
@login_manager.unauthorized_handler
def unauthorized(msg=None):
   '''Handles unauthorized request  '''
   return Response.make_error_resp(msg="You're not authorized!", code=401)
   
   
@account.route('/verify_auth', methods=['GET'])
@login_required
def verify_auth():  
   '''Returns an HTTP 200 response and the user representation if user is logged in; returns a 401 status code and an error message if not.'''
   return Response.make_data_resp(data=current_user.to_json())

@account.route("/ucla_verified", methods=['GET'])
@login_required
def is_ucla_verified():
   '''Temporary api call to check if user has a ucla verified email'''
   ucla_circle = Circle.by_name("ucla")
   if ucla_circle:
      auth = UserCircleAuth.by_user_circle_not_temp(current_user, ucla_circle)
      if auth:
         return Response.make_data_resp(data=True)
      return Response.make_data_resp(data=False)
   return Response.make_error_resp(msg="UCLA group does not exist!")
   
@account.route('/settings', methods=['GET'])
@login_required
def get_settings():
   '''Return settings for the logged in user'''
   return Response.make_data_resp(data=current_user.to_json())

   
@account.route('/settings', methods=['PUT'])
@login_required
def update_settings():
   form = SettingsForm()
   if form.validate_on_submit():
      user = current_user
      try:
         user.first_name = form.first_name.data
         user.last_name = form.last_name.data
         settings = current_user.user_settings
         form.populate_obj(settings)
         settings.sex_code = form.sex_code.data;
         user.settings = settings
         db.session.commit()
      except Exception as e:
         return Response.make_exception_resp(exception=e)

      return Response.make_data_resp(data=current_user.to_json(), msg="You have successfully updated your settings!")
   return Response.make_form_error_resp(form=form)
   

@account.route('/password', methods=['PUT'])
@login_required
def change_password():
   user = current_user
   
   if user.has_no_password():
      form = FirstPasswordForm()
   else:
      form = PasswordForm()
   
   if form.validate_on_submit():
      
      if not user.has_no_password() and not user.check_password(form.old_password.data):
         return Response.make_error_resp(msg="Current password given is wrong!", code=401) 
         
      try:   
         user.password = form.password.data
         db.session.commit()
      except Exception as e:
         return Response.make_exception_resp(exception=e)
         
      return Response.make_success_resp(msg="You have successfully changed your password!") 
                 
   return Response.make_form_error_resp(form=form)
   

@account.route('/picture', methods=['POST'])
@login_required
def update_picture():
   form = ImageForm()
   if form.validate_on_submit():
      file = request.files[form.file.name]
      
      if file and allowed_image_file(file.filename):
         try:
            file_data = file.read()
            user = current_user
            root, ext = os.path.splitext(file.filename)
            #save shurnk image and thumbnail
            img_data, img_thumb_data = get_resize_profile_pic(file_data)
            save_profile_image(user, img_data, img_thumb_data, ext)
         
            db.session.commit()
         except Exception as e:
            return Response.make_exception_resp(exception=e)

         return Response.make_data_resp(data=user.get_picture(),msg="You have successfully changed your profile picture!") 
         
      else:
         return Response.make_error_resp(msg="File extension not allowed")
         

   return Response.make_form_error_resp(form=form)

@account.route('/fb_link', methods=['PUT'])
@login_required
def update_fb_link(): 
   '''
      This link simply toggles between link and unlink. 
      NOTE: User SHOULDNT be able to unlink right now.
   '''
   user = current_user
   try:
      if user.fb_account is None:
           
         #link to fb 
         fb_user, error = get_fb_user_from_cookie(request.cookies, validate_taken=True)
         if error:
            return Response.make_error_resp(msg=error['msg'], code=error['code']) 
               
         graph = get_fb_graph_from_user(fb_user)
         long_token = get_long_token(graph)
   
         # register user's facebook account
         user.fb_account = UserFacebookAccount(
                                    fb_id = fb_user['uid'], 
                                    access_token=long_token['access_token'], 
                                    expires_at=get_current_time_plus(seconds=int(long_token['expires'])))
         db.session.add(user.fb_account)
         db.session.commit()
         
         # add user to ucla group if he's part of it on facebook
         add_user_to_college_if_member(graph, 'ucla', user)
 
         return Response.make_success_resp(msg="You successfully linked to your fb account!")
      
      else:   
         # if user is already linked, ignore it.
         '''
         #remove all circles auth with this facebook account
         user_auths = UserCircleAuth.by_user_and_facebook(user)
         for user_auth in user_auths:
            circle = Circle.by_id(user_auth.circle_id)
            db.session.delete(user_auth)
            db.session.commit()
            
            #remove user from circle if no auth exists anymore
            user_auth = UserCircleAuth.by_user_and_circle(user, circle)
            if not user_auth:
               leave_circle(user, circle)
         '''
         '''
         #remove the fb account completely
         db.session.delete(user.fb_account)
         db.session.commit()  
         '''
         
         pass 
      
   except Exception as e:
      return Response.make_exception_resp(exception=e)
      
   return Response.make_success_resp(msg="Facebook account cannot be unlinked right now!")
   #return Response.make_success_resp(msg="You successfully unlinked to your fb account!")

   
@account.route('/emails', methods=['GET'])
@login_required
def get_emails():
   emails = current_user.emails
   return Response.make_data_resp(data=[i.to_json() for i in emails])
   
@account.route('/emails', methods=['POST'])
@login_required
def add_new_email():
   form = AddEmailForm()
   if form.validate_on_submit():
      user = current_user
      
      #check if email is already taken
      if Email.is_email_taken(form.email.data):
         return Response.make_error_resp(msg="This email is already taken!", code=409)
         
      try:
         
         email = Email(address=form.email.data, is_primary=False)
         user.add_email(email)
         db.session.add(email)
   
         #create new email action
         new_action = EmailAuthAction(user=user, action_code = VERIFY_EMAIL, email=email.address)
         db.session.add(new_action)
         db.session.commit()
         
         #send verification email
         send_user_email.delay(user.user_name, new_action.email, new_action.action_code, new_action.activation_key)


      except Exception as e:
         return Response.make_exception_resp(exception=e)
      
      return Response.make_data_resp(data=email.to_json(), msg="You have successfully added an email! Please check your email to verify it.")
      
   
   return Response.make_form_error_resp(form=form)


@account.route('/emails/<int:id>/verify', methods=['GET'])
@login_required
def send_verify_email(id):
   user = current_user
   email = Email.by_user_and_id(user, id)
   if not email:
      abort(404, "The email is unavailable or doesn't belong to you")
   
   try:
      #create new email action
      new_action = EmailAuthAction(user=user, action_code = VERIFY_EMAIL, email=email.address)
      db.session.add(new_action)
      db.session.commit()
         
      #send verification email
      send_user_email(user.user_name, new_action.email, new_action.action_code, new_action.activation_key)
   except Exception as e:
      return Response.make_exception_resp(exception=e)
      
   return Response.make_success_resp(msg="We have sent a verification email to '%s'!" % email.address)
   

#The only allowed changes is to set primary
@account.route('/emails/<int:id>/set_primary', methods=['PUT'])
@login_required
def update_email(id):
   user = current_user
   #check if email exists
   email = Email.by_user_and_id(user, id)
   if not email:
      abort(404, "The email is unavailable or doesn't belong to you")
   
   #if email is already primary
   if email.is_it_primary(): 
      return Response.make_success_resp(msg="Email at '%s' is already your primary email address!" % email.address)
   
   try:
      #set current primary email to false
      user.set_primary_email(email)
      db.session.commit()
      
   except Exception as e:
      return Response.make_exception_resp(exception=e)
         
   return Response.make_success_resp(msg="You have set the email at '%s' to be your primary email!" % email.address)


   
#NOTE: I can't use 'DELETE' here because PUT and DELET can't carry form data..
#see http://librelist.com/browser/flask/2011/3/1/support-for-http-delete-entity-body/
@account.route("/emails/<int:id>/delete", methods=['POST'])
@login_required
def delete_email(id):
   user = current_user
   #check if email exists
   email = Email.by_user_and_id(user, id)
   if not email:
      abort(404, "The email is unavailable or doesn't belong to you")
      
   #check if the email is primary 
   if email.is_it_primary():
      abort(403, "You can't delete a primary email address. Set another email to primary and try again.")
      
   try:
      #delete circle auth if it exists and remove member from circle
      user_auth = UserCircleAuth.by_user_email_src(user, email.address)
      if user_auth:
         db.session.delete(user_auth)
         db.session.commit()
         
         #Only remove user from circle if no more authorizations exist
         circle = Circle.by_id(user_auth.circle_id)
         user_auth = UserCircleAuth.by_user_and_circle(user, circle)
         if not user_auth:
            leave_circle(user, circle)
         
      #delete email (all associated email action will be on cascade deleted too)
      db.session.delete(email)
      db.session.commit()
   except Exception as e:
      return Response.make_exception_resp(exception=e)
      
   return Response.make_success_resp(msg="You have deleted the email!")