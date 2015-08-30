from flask_wtf import Form
from wtforms import (BooleanField, TextField, HiddenField, PasswordField, 
   DateTimeField, validators, IntegerField, SubmitField)
import UserConstants

class LoginForm(Form):
   login = TextField('user_name', [validators.Required()])
   password  = TextField('password',  [validators.Required()])
   remember_me = BooleanField('remember_me', default = False)
     
class SignupForm(Form):
   user_name   = TextField('user_name',   [
      validators.Length(
         min = UserConstants.MIN_USERNAME_LEN, 
         max = UserConstants.MAX_USERNAME_LEN
      ),
      validators.Regexp(
         "^[a-zA-Z0-9]*$",
         message="Username can only contain letters and numbers"
      )
   ])
   first_name  = TextField('first_name', [validators.Required()])
   last_name   = TextField('last_name', [validators.Required()])
   email       = TextField('email', [validators.Required(), validators.Email()])
   password    = PasswordField(
      'New Password', 
      [validators.Length(min=UserConstants.MIN_PASSWORD_LEN,max=UserConstants.MAX_PASSWORD_LEN)]
   )
   confirm     = PasswordField('Repeat Password', [
      validators.Required(),
      validators.EqualTo('password', message='Passwords must match')
   ])