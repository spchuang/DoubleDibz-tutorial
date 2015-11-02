import re
from ..helpers import JsonSerializer, get_current_time
from ..extensions import db
from . import constants as HASHTAGS
from ..constants import STRING_LEN
from .constants import MAX_HASHTAGS


class HashtagJsonSerializer(JsonSerializer):
   __json_public__ = ['name']
      
class Hashtag(db.Model, HashtagJsonSerializer):
   __tablename__ = "hashtag"
   def __repr__(self):
      return '<hashtag %r %r>' % (self.id, self.name)
      
   id     = db.Column(db.Integer, primary_key = True)
   name   = db.Column(db.String(STRING_LEN), unique=True, nullable = False)
   under_id = db.Column(db.Integer, db.ForeignKey('hashtag.id'), nullable = True)

   under  = db.relationship('Hashtag', remote_side=id, post_update=True) 
   
   @classmethod
   def validate_hashtags(cls, hashtags_str):
      '''
         return parsed_hashtag, error. The parsed hashtags are all distinct
      '''
      
      ht = [str(h.strip().lower()) for h in hashtags_str.split(',')]
      filter(None, ht)
      
      #remove duplicates
      ht = sorted(set(ht))      
      
      if len(ht) > MAX_HASHTAGS:
         return None, {'msg': "You can only have a maximum of %s hashtags" %MAX_HASHTAGS}
      
      has_category = False
      for h in ht:
         #test if space exists in given input
         if re.match(r'^[a-zA-Z0-9_]*$', h) == None:
            return None, {'msg': "Hashtags can only be underscore (_), uppercase or lowercase caracters"}
         
         if h in HASHTAGS.CATEGORIES:
            has_category = True
            
      if not has_category:
         return None, {'msg': "You need to have at least one hashtag from the categories"}
      return ht, None
      
      
   @classmethod
   def by_name(cls, name):
      return cls.query.filter(Hashtag.name==name).first()
      
   @classmethod
   def get_all(cls):
      return Hashtag.query.options(db.load_only('name')).all()
   
post_hashtag_rel = db.Table('post_hashtag_rel',
   db.Column('post_id',    db.Integer, db.ForeignKey('post.id')),
   db.Column('hashtag_id', db.Integer, db.ForeignKey('hashtag.id')),
   db.UniqueConstraint('post_id', 'hashtag_id')
)                
