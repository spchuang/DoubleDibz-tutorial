from flask_wtf import Form
from wtforms import (BooleanField, TextField, HiddenField, PasswordField, 
   DateTimeField, validators, IntegerField, SubmitField, DecimalField)
from wtforms.validators import DataRequired

class CreateChatForm(Form):
   post_id = IntegerField('post_id', [validators.Required()])
   message = TextField('message', [validators.Required()])

class CreateChatMessageForm(Form):
   message = TextField('message', [validators.Required()])