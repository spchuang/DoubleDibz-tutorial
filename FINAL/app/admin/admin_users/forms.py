from flask_wtf import Form
from wtforms import (BooleanField, TextField, HiddenField, PasswordField, 
   DateTimeField, validators, IntegerField, SubmitField)
from wtforms.validators import DataRequired

class LoginForm(Form):
   username = TextField('username', [validators.Required()])
   password  = TextField('password',  [validators.Required()])