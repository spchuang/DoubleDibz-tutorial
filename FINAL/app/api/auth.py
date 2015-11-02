'''
   Users API for authentication, account setting, logging out
'''

from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify)
from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh

from .. import response as Response
from ..helpers import get_current_time, get_current_time_plus
from ..extensions import db, login_manager, csrf

from ..users import User, UserSettings, UserFacebookAccount, UserCircleAuth, SignupForm, LoginForm, checkFBidForm, checkEmailForm, FBSignupForm, FirstPasswordForm, MALE, FEMALE
from ..emails import Email, EmailAuthAction, send_user_email, ACTIVATE_USER, RESET_PASSWORD, VERIFY_EMAIL
from ..circles import Circle, CollegeInfo
from ..circles.helpers import join_circle, leave_circle, add_user_to_college_if_member
from ..fb_helpers import get_fb_user_from_cookie, get_fb_graph_from_user, authenticate_user_from_cookie, get_long_token, get_fb_profile_image, save_profile_image, authenticate_user_from_fid

from ..notifications.tasks import send_system_notification

auth = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth.route('/domain', methods=['GET'])
def get_domain():
   return Response.make_data_resp(data= current_app.config['DOMAIN_NAME'], msg="")

@auth.route('/login', methods=['POST'])
def login():
   """ POST only operation. check login form. Log user in """
   if current_user.is_authenticated():
      return redirect(url_for('account.verify_auth'))

   form = LoginForm()

   if form.validate_on_submit():
      user, authenticated = User.authenticate(form.login.data,
                                              form.password.data)
      if user :
         if authenticated:
            login_user(user, remember=form.remember_me.data)
            return Response.make_data_resp(data=current_user.to_json(), msg="You have successfully logged in")
         else:
            return Response.make_error_resp(msg="Invalid username or password", type="Wrong Authentication", code=422)
      else:
         return Response.make_error_resp(msg="Username does not exist", type="Wrong Authentication", code=422)

   return Response.make_form_error_resp(form=form)


@auth.route('/logout', methods=['POST'])
@login_required
def logout():
   """ logout user, remove facebook login session """
   session.pop('login', None)
   logout_user()
   return Response.make_success_resp(msg="You have successfully logged out")


@auth.route('/fb_signup', methods=['POST'])
def fb_signup():
   try:
      # fb signup form has user_name and email
      form = FBSignupForm()
      if not form.validate_on_submit():
         return Response.make_form_error_resp(form=form)

      if User.is_user_name_taken(form.user_name.data):
         return Response.make_error_resp(msg="This username is already taken!", code=409)

      if Email.is_email_taken(form.email.data):
         return Response.make_error_resp(msg="This email is already taken!", code=409)

      fb_user, error = get_fb_user_from_cookie(request.cookies, validate_taken=True)
      if error:
         return Response.make_error_resp(msg=error['msg'], code=error['code'])

      graph = get_fb_graph_from_user(fb_user)
      profile = graph.get_object("me")
      long_token = get_long_token(graph)

      #create new user from fb profile
      user = User(
                  first_name = profile['first_name'],
                  last_name  = profile['last_name'],
                  user_name  = form.user_name.data,
                  fb_account = UserFacebookAccount(
                                    fb_id = fb_user['uid'],
                                    access_token=long_token['access_token'],
                                    expires_at=get_current_time_plus(seconds=int(long_token['expires']))),
                  user_settings = UserSettings())

      #get_fb_profile_image
      img, img_thumb = get_fb_profile_image(fb_user['uid'])
      save_profile_image(user, img.read() , img_thumb.read())

      # for now, any non male is female
      if(profile['gender'] == 'male'):
         user.user_settings.sex_code = MALE
      else:
         user.user_settings.sex_code = FEMALE

      email = Email(address=form.email.data, is_primary=True)
      user.add_email(email)

      db.session.add(email)
      db.session.add(user)
      db.session.commit()

      #create new email action
      new_action = EmailAuthAction(user=user, action_code=ACTIVATE_USER, email=email.address)
      db.session.add(new_action)
      db.session.commit()

      #send new user email
      send_user_email.delay(user.user_name, new_action.email, new_action.action_code, new_action.activation_key)

      # if user is part of fb's ucla group, add his circle authentication
      add_user_to_college_if_member(graph, 'ucla', user)

      # send welcome notification
      send_system_notification.delay(user.id, 0)

      #log the user in
      login_user(user)

   except Exception as e:
      return Response.make_exception_resp(exception=e)

   return Response.make_success_resp(msg="You successfully signed up! Please check your email for further verification.")


@auth.route('/fb_login', methods=['POST'])
def fb_login():
   '''
      uses the fb coookie to login.
   '''
   try:
      user , error = authenticate_user_from_cookie(request.cookies)

      if error:
         return Response.make_error_resp(msg=error['msg'], code=error['code'])

      login_user(user)
   except Exception as e:
      return Response.make_exception_resp(exception=e)
   return Response.make_data_resp(data=current_user.to_json(), msg="You have successfully logged in")

@csrf.exempt
@auth.route('/fb_app_login', methods=['POST'])
def fb_app_login():
   '''
      uses the fb id to login.
   '''
   try:
      user, error = authenticate_user_from_fid(request.form.get('uid'))

      if error:
         return Response.make_error_resp(msg=error['msg'], code=error['code'])

      login_user(user, remember=True)
   except Exception as e:
      return Response.make_exception_resp(exception=e)

   return Response.make_data_resp(data=current_user.to_json(), msg="You have successfully logged in")


@auth.route('/signup', methods=['POST'])
def signup():
   if current_user.is_authenticated():
      return make_success_resp("You're already signed up")

   form = SignupForm()

   if form.validate_on_submit():
      #check if user_name or email is taken
      if User.is_user_name_taken(form.user_name.data):
         return Response.make_error_resp(msg="This username is already taken!", code=409)
      if Email.is_email_taken(form.email.data):
         return Response.make_error_resp(msg="This email is already taken!", code=409)

      try:
         #create new user
         user = User()
         user.user_settings = UserSettings()

         form.populate_obj(user)
         email = Email(address=form.email.data, is_primary=True)
         user.add_email(email)

         db.session.add(email)
         db.session.add(user)
         db.session.commit()

         #create new email action
         new_action = EmailAuthAction(user=user, action_code = ACTIVATE_USER, email=email.address)
         db.session.add(new_action)
         db.session.commit()

         '''
         #add user to ucla group, this is temporary thus source="temp"
         ucla_circle = Circle.by_name("ucla")
         if ucla_circle:
            new_auth = UserCircleAuth(user_id=user.id, circle_id=ucla_circle.id, source="temp")
            join_circle(user, ucla_circle)
            db.session.add(new_auth)
            db.session.commit()
         '''

         #send new user email
         send_user_email.delay(user.user_name, new_action.email, new_action.action_code, new_action.activation_key)

         # send welcome notification
         send_system_notification.delay(user.id, 0)

      except Exception as e:
         return Response.make_exception_resp(exception=e)

      #log the user in
      login_user(user)
      return Response.make_success_resp(msg="You successfully signed up! Please check your email for further verification.")

   return Response.make_form_error_resp(form=form)


@auth.route('/check_fb_id', methods=['POST'])
def check_fb_id():
   '''
      Check if the given fb id has already been linked to the user's account.
   '''
   form = checkFBidForm()
   if form.validate_on_submit():
      data = {}
      if UserFacebookAccount.is_fb_id_taken(form.fb_id.data):
         data['status'] = 'taken'
      else:
         data['status'] = 'available'

      return Response.make_data_resp(data=data)

   return Response.make_form_error_resp(form=form)


@auth.route('/check_email', methods=['POST'])
def check_email():
   '''
      Check if the given email has already been registered for our users
   '''
   form = checkEmailForm()
   if form.validate_on_submit():
      data = {}
      if Email.is_email_taken(form.email.data):
         data['status'] = 'taken'
      else:
         data['status'] = 'available'
      return Response.make_data_resp(data=data)

   return Response.make_form_error_resp(form=form)


@auth.route('/forgot_password',  methods=['POST'])
def forgot_password():
   '''
      Check if the given email is registered, and then send the reset password email
   '''
   form = checkEmailForm()
   if form.validate_on_submit():
      email = Email.by_address(form.email.data)
      if email:
         #create new email action
         new_action = EmailAuthAction(user=email.user, action_code = RESET_PASSWORD, email=form.email.data)
         db.session.add(new_action)
         db.session.commit()

         #send reset password email
         send_user_email.delay(email.user.user_name, new_action.email, new_action.action_code, new_action.activation_key)
         return Response.make_success_resp(msg="Reset password email sent!")

      return Response.make_error_resp(msg="The email '%s' is not tied to an account!" % form.email.data, code=401)

   return Response.make_form_error_resp(form=form)


@auth.route('/verify', methods=['GET', 'POST'])
def verify():
   user = None
   activation_key = request.args.get('key')
   action_code    = request.args.get('action')
   email_address  = request.args.get('email')
   try:
      if not activation_key or not action_code or not email_address:
         return Response.make_error_resp(msg="invalid token, please try again.", code=400)

      email_action = EmailAuthAction.by_key_action_email(activation_key, action_code, email_address)

      #invalid email action
      if email_action is None:
         return Response.make_error_resp(msg="Invalid login token, please try your email again", code=400)

      #if session expires
      if email_action.isExpired():
         return Response.make_error_resp(msg="This key has expired!", code=410)

      email = email_action.email_ref
      msg = ''
      if email_action.action_code == ACTIVATE_USER:
         user = email_action.user
         user.set_to_active()
         email.set_to_verified(yes=True)

         #remove email action (NOTE: should we remove it or just expire it?)
         db.session.delete(email_action)
         db.session.commit()

         msg = 'You have successfully activated your user!'
      elif email_action.action_code == RESET_PASSWORD:
         form = FirstPasswordForm()
         if form.validate_on_submit():
            #set new password and delete email action
            user = email_action.user
            user.password = form.password.data
            db.session.delete(email_action)
            db.session.commit()

         else:
            return Response.make_form_error_resp(form=form)

         msg="You have successfully reset your password!"
      elif email_action.action_code == VERIFY_EMAIL:
         user = email_action.user
         email.set_to_verified(yes=True)
         db.session.delete(email_action)

         # get the last two domain (e.g. ucla.edu) of the email
         email_domain = '.'.join(email.address.split("@")[1].split(".")[-2:])
         email_domain.strip()

         college = CollegeInfo.by_domain(email_domain)

         # if user's email matches a college, add him to the college circle
         if college:
            college_circle = Circle.by_id(college.circle_id)

            if college_circle:
               # check if user does not have an auth with the email address again
               user_auth = UserCircleAuth.by_user_email_src(user, email.address)
               if not user_auth:
                  new_auth = UserCircleAuth(user_id=user.id, circle_id=college_circle.id, source=email.address)
                  db.session.add(new_auth)

               #join user in circle
               join_circle(user, college_circle)

         db.session.commit()
         msg = 'You have successfully verified your email at %s!' % email.address
   except Exception as e:
      return Response.make_exception_resp(exception=e)
   return Response.make_success_resp(msg=msg)
