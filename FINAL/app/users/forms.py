from flask_wtf import Form
from wtforms import (BooleanField, TextField, HiddenField, PasswordField, 
   DateTimeField, validators, IntegerField, SubmitField)
from wtforms.validators import DataRequired
from .constants import MIN_USERNAME_LEN, MAX_USERNAME_LEN, MIN_PASSWORD_LEN, MAX_PASSWORD_LEN

class LoginForm(Form):
   login = TextField('user_name', [validators.Required()])
   password  = TextField('password',  [validators.Required()])
   remember_me = BooleanField('remember_me', default = False)

class checkEmailForm(Form):
   email       = TextField('email',        [validators.Required(), validators.Email()])
   
class checkFBidForm(Form):
   fb_id       = IntegerField('fb_id', [validators.Required()])

class FBSignupForm(Form):
   user_name   = TextField('user_name',    [
      validators.Length(min = MIN_USERNAME_LEN, max = MAX_USERNAME_LEN),
      validators.Regexp("^[a-zA-Z0-9]*$",message="Username can only contain letters and numbers")
   ])
   email       = TextField('email',        [validators.Required(), validators.Email()])

     
class SignupForm(Form):
   fb_id       = IntegerField('fb_id')
   user_name   = TextField('user_name',   [
      validators.Length(min = MIN_USERNAME_LEN, max = MAX_USERNAME_LEN),
      validators.Regexp("^[a-zA-Z0-9]*$",message="Username can only contain letters and numbers")
   ])
   first_name  = TextField('first_name',   [validators.Required()])
   last_name   = TextField('last_name',    [validators.Required()])
   email       = TextField('email',        [validators.Required(), validators.Email()])
   password    = PasswordField('New Password', [
      validators.Length(min=MIN_PASSWORD_LEN, max=MAX_PASSWORD_LEN)
   ])
   confirm     = PasswordField('Repeat Password', [
      validators.Required(),
      validators.EqualTo('password', message='Passwords must match')
   ])
   
class SettingsForm(Form):
   first_name  = TextField('first_name',   [validators.Required()])
   last_name   = TextField('last_name',    [validators.Required()])
   
   sex_code    = IntegerField('sex_code', [validators.AnyOf(message="Sorry you can only choose male or female", values=[0,1])])
   phone       = TextField('phone', [
      validators.Optional(),
      validators.Regexp("^(?:\([2-9]\d{2}\)\ ?|[2-9]\d{2}(?:\-?|\ ?))[2-9]\d{2}[- ]?\d{4}$", message="Not valid phone number (xxx-xxx-xxxx)")
   ])
   bio         = TextField('bio')

class PasswordForm(Form):
   old_password        = PasswordField('Current Password', [validators.Required()])
   password    = PasswordField('New Password', [
      validators.Length(min=MIN_PASSWORD_LEN, max=MAX_PASSWORD_LEN)
   ])
   confirm         = PasswordField('Repeat Password', [
      validators.Required(),
      validators.EqualTo('password', message='Passwords must match')
   ])

class FirstPasswordForm(Form):
   password        = PasswordField('Password', [
      validators.Length(min=MIN_PASSWORD_LEN, max=MAX_PASSWORD_LEN)
   ])
   confirm         = PasswordField('Repeat Password', [
      validators.Required(),
      validators.EqualTo('password', message='Passwords must match')
   ])

class PasswordRequiredForm(Form):
   password    = PasswordField('Current Password', [validators.Required()])
   
class AddEmailForm(Form):
   email       = TextField('email',        [validators.Required(), validators.Email()])