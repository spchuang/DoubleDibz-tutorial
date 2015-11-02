from flask_wtf import Form
from wtforms import (BooleanField, TextField, HiddenField, PasswordField,
   DateTimeField, validators, IntegerField, SubmitField, DecimalField)
from wtforms.validators import DataRequired
from .constants import POST_STATUS
from ..notifications import SUBSCRIBE_STATUS

class SellingPostForm(Form):
   name = TextField('name', [validators.Required()])
   price = TextField('price', [
         validators.Required(),
         validators.Regexp("^(\d{1,8})?(.\d{1,2})?$", message="Please put valid prices that is up to 2 decimals")
   ])
   hashtags    = TextField('hashtags', [validators.Required()])
   description = TextField('description', [validators.Required()])
   images = TextField('images')
   primary_image_id = TextField('primary_image_id')
   
class BuyRequestForm(Form):
   name = TextField('name', [validators.Required()])
   hashtags    = TextField('hashtags', [validators.Required()])
   description = TextField('description', [validators.Required()])
   
   
def post_status_check(form, field):
    if field.data not in POST_STATUS:
        raise validators.ValidationError('status code is invalid')
        
class updateStatusForm(Form):
   status_code = IntegerField('status_code', [
      validators.Optional(), post_status_check
   ])

def subscribe_status_check(form, field):
    if field.data not in SUBSCRIBE_STATUS:
        raise validators.ValidationError('status code is invalid')
   
class updateSubscribeStatusForm(Form):
   status_code = IntegerField('status_code', [
      validators.Optional(), subscribe_status_check
   ])