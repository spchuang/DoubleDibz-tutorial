from flask_wtf import Form
from wtforms import (BooleanField, TextField, HiddenField, PasswordField, 
   DateTimeField, validators, IntegerField, SubmitField, DecimalField,FileField)

class ImageForm(Form):
   file = FileField(u"file", [validators.Required()])
   