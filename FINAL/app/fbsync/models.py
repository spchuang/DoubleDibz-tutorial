from ..helpers import JsonSerializer, get_current_time,dump_datetime
from ..extensions import db
from sqlalchemy.dialects.mysql import BIGINT
from flask.ext.login import current_user

from ..posts import PostBookmark, SOURCE_FB
from .constants import UNDECIDED, SELLING, BUYING, UNPUBLISHED, PUBLISHED, DELETED 
from sqlalchemy.ext.declarative import declarative_base

'''
   Make sure to keep in sync with fbsync code.
'''
STRING_LEN = 100
MESSAGE_LEN = 1000
URL_LEN     = 400
      
class FBFeed(db.Model):
   __bind_key__ = 'fbsync'
   __tablename__ = "fb_feed"
   id          = db.Column(db.Integer, primary_key = True)
   feed_id    = db.Column(db.String(STRING_LEN),  unique = True, nullable=False)
   group_id   = db.Column(BIGINT(unsigned=True), db.ForeignKey("fb_college.sell_id"), nullable=False)
   user_id    = db.Column(BIGINT(unsigned=True), nullable=False)
   user_name  = db.Column(db.String(STRING_LEN), nullable = False)
   description = db.Column(db.String(MESSAGE_LEN, collation='utf8_bin'), nullable = False)
   modified_at   = db.Column(db.DateTime, nullable=False)
   application   = db.Column(db.String(STRING_LEN), nullable = False)
   type          = db.Column(db.String(STRING_LEN), nullable = False)
   created_at    = db.Column(db.DateTime, nullable=False)
   
   post_type = db.Column(db.SmallInteger, default=UNDECIDED, nullable=False)
   status    = db.Column(db.SmallInteger, default=UNPUBLISHED, nullable=False)
   price     = db.Column(db.Numeric(precision=10,scale=2), nullable = True)
   
   # ================================================================
   # Relationships
   images    = db.relationship('FBFeedImage', uselist=True, cascade="all,delete", lazy='joined')
   hashtags = db.relationship("Hashtag", 
      secondary="feed_hashtag_rel", 
      primaryjoin = "feed_hashtag_rel.c.post_id == FBFeed.id",
      secondaryjoin = "feed_hashtag_rel.c.hashtag_id == Hashtag.id", lazy = 'joined')
   
   
   def to_json(self, user=None, get_bookmarks=False):
      data = {
         'id'           : self.id,
         'feed_id'      : self.feed_id,
         'description'  : self.description,
         'images'       : [i.to_json() for i in self.images], 
         'created_at'   : dump_datetime(self.created_at),
         'src'          : 'fb',
         'price'        : self.price
      }
      
      data['hashtags'] = [i.to_json() for i in self.hashtags]
      if get_bookmarks and user and not user.is_anonymous():
         bookmarks = PostBookmark.by_all(self.id, current_user.id, SOURCE_FB)
         if bookmarks:
            data['is_bookmarked'] = True
         else:
            data['is_bookmarked'] = False
      return data
   
   @classmethod
   def exists(cls, feed_id):
      return db.session.query(db.exists().where(FBFeed.feed_id==feed_id)).scalar()
      
   @classmethod
   def by_id(cls, id):
      return cls.query.filter(FBFeed.id == id).first()
      
class FBFeedImage(db.Model):
   __bind_key__ = 'fbsync'
   __tablename__ = 'fb_feed_image'
   id      = db.Column(db.Integer, primary_key = True)
   feed_id = db.Column(db.String(STRING_LEN), db.ForeignKey("fb_feed.feed_id"), nullable=False)
   link    = db.Column(db.String(URL_LEN), nullable = False)
   def to_json(self):
      return {
         'link'  : self.link,
         'id'    : self.id,
      }
   
feed_hashtag_rel = db.Table('feed_hashtag_rel',
   db.Column('post_id',    db.Integer, db.ForeignKey('fb_feed.id')),
   db.Column('hashtag_id', db.Integer, db.ForeignKey('hashtag.id')),
   db.UniqueConstraint('post_id', 'hashtag_id'),
   info={'bind_key': 'fbsync'}
)