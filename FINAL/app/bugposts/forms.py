from flask_wtf import Form
from wtforms import (BooleanField, TextField, HiddenField, PasswordField, 
   DateTimeField, validators, IntegerField, SubmitField, DecimalField)
from wtforms.validators import DataRequired

class ReportBugForm(Form):
   name = TextField('name', [validators.Required()])
   description = TextField('description', [validators.Required()])