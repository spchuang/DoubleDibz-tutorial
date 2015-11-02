from ..helpers import JsonSerializer, get_current_time
from ..extensions import db
from ..constants import FILE_NAME_LEN
from .helpers import get_s3_link, add_thumb_ext
from .constants import THUMBNAIL_EXTENSION
from flask import url_for, current_app
import os

class ImageJsonSerializer(JsonSerializer):
   __json_public__ = ['id','is_primary']

class Image(db.Model, ImageJsonSerializer):
   __tablename__ = "image"
   def __repr__(self):
      return '<Image %r>' % (self.id)
      
   id            = db.Column(db.Integer, primary_key = True)
   file_name     = db.Column(db.String(FILE_NAME_LEN), nullable=False)
   post_id       = db.Column(db.Integer, db.ForeignKey("post.id"))
   created_at    = db.Column(db.DateTime, nullable=False, default = get_current_time)
   modified_at   = db.Column(db.DateTime, nullable=False, default = get_current_time, onupdate=get_current_time)
   user_id       = db.Column(db.Integer, db.ForeignKey("user.id"))
   is_primary    = db.Column(db.SmallInteger, default=0)
   
   def on_s3(self):
      #if post_id is defined then assume the file has been uploaded to s3
      return self.post_id
   
   def set_primary(self, to_primary):
      self.is_primary = 1 if to_primary else 0 
   
   def to_json(self):
      data = super(Image, self).to_json()
      
      if self.on_s3():
         data['link']      = get_s3_link(self.file_name)
         data['thumbnail'] = add_thumb_ext(data['link'])
      else:
         data['link']      = url_for('images.retrieve_image', filename=self.file_name, _external=True) 
         data['thumbnail'] = url_for('images.retrieve_image', filename=add_thumb_ext(self.file_name), _external=True) 
         
         
      return data
      
   def get_thumb(self):
      if self.on_s3():
         return add_thumb_ext( get_s3_link(self.file_name) )
      else:
         return url_for('images.retrieve_image', filename=add_thumb_ext(self.file_name), _external=True) 
   

   # ================================================================ 
   # Class methods
   @classmethod
   def by_id(cls, id):
      return cls.query.filter(Image.id==id).first()
      
   @classmethod
   def by_user(cls, user):
      return cls.query.filter(Image.user_id==user.id).all()
      
   @classmethod
   def tmp_by_user(cls, user):
      return cls.query.filter(Image.user_id==user.id).filter(Image.post_id == None).all()