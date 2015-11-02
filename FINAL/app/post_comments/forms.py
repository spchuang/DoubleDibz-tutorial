from flask_wtf import Form
from wtforms import TextField, SubmitField, validators
from wtforms.validators import DataRequired

class PostCommentForm(Form):
   comment = TextField('comment', [validators.Required()])
   fb_ids = TextField('fb_ids')