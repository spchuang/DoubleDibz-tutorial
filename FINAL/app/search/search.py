from flask.ext.login import current_user
from ..extensions import db
from sqlalchemy.sql import func

from ..posts import Post, PostBookmark, SOURCE_US, SellingPost, BuyRequest, BUYING, SELLING
from ..hashtags import Hashtag, post_hashtag_rel
from ..circles import Circle, circle_post_rel
from ..users import User
from ..images import Image
from ..notifications import UserPostSubscribe
from .helpers import get_search_time, apply_order_query

class Search():
   def __init__(self, filters):
      self.name            = filters.get('name')
      self.user_name       = filters.get('user_name')
      self.hashtag_id      = filters.get('hashtag_id')
      self.hashtag         = filters.get('hashtag')
      self.status_code     = filters.get('status')
      self.post_type       = filters.get('type')
      self.circle          = filters.get('circle')
      self.order           = filters.get('order')
      self.time         = get_search_time(filters.get('from'))
      self.per_page     = filters.get('per_page')
      self.page         = filters.get('page')
      
      #use -1 instead of None because None is returned when no match
      self._c_id = -1
      
      self.limit = self.per_page
      self.offset = (self.page - 1) * self.per_page
      
      if self.name:
         self.name = self.name.lower()
          
      self.tempPostId = []
          
   def setup(self):
      '''
         Retrieves the circle ID, and hashtag ID
      '''
      #if no circle is given return no posts
      if not self.circle : 
         return False
      
      _c_id = None
      
      #search through given circle 
      if self.circle and self._c_id == -1:
         q = db.select([Circle.id]).where(Circle.name == self.circle.lower())
         _c_id = db.session.execute(q).first()
         #circle does not exist
         if not _c_id:
            return False

         self.c_id = _c_id[0]
      
      return True
      
   def apply_condition(self, query):
      #NOTE: we can't have user_id and subscriber_id at the same time
      query = query.filter(User.id == Post.user_id)
      
      #conditional joining
      
      if self.hashtag_id: 
         
         
         num_hashtag = len(self.hashtag_id)
         if num_hashtag == 1:
            query = query.join(post_hashtag_rel)
            query = query.filter(post_hashtag_rel.c.hashtag_id.like(self.hashtag_id[0]))
         else:         
         
         # relational division (this is prob ALOT slower)
            
            if not self.tempPostId:
               # get the ids of post that have the hashtags
               q = db.select([post_hashtag_rel.c.post_id])\
                  .where(post_hashtag_rel.c.hashtag_id.in_(self.hashtag_id))\
                  .group_by(post_hashtag_rel.c.post_id)\
                  .having(func.count(post_hashtag_rel.c.hashtag_id) == num_hashtag)
               self.tempPostId = [row[0] for row in db.session.execute(q).fetchall()]
            
            query = query.filter(Post.id.in_(self.tempPostId))
            

      query = query.join(circle_post_rel).filter(Post.id==circle_post_rel.c.post_id)\
                  .filter(circle_post_rel.c.circle_id == self.c_id)
      
      if self.name is not None: 
         query = query.filter(Post.name.ilike('%'+self.name+'%'))
         
      if self.user_name is not None:
         query = query.filter(User.user_name == self.user_name)
      
      if self.status_code != "all":
         query = query.filter(Post.status_code==self.status_code)
      
      if self.time is not None:
         query = query.filter(Post.created_at > self.time)
      
      return query
      
   def count_posts(self):
      '''
         TODO: optiimise this part with redddis
      '''
      # if hashtag_id is None, no POST
      if self.hashtag and self.hashtag_id is None: 
         self.total = 0
         return self.total
      
      if self.post_type == 'sell':
         query = db.session.query(db.func.count(SellingPost.id))
      else:
         query = db.session.query(db.func.count(BuyRequest.id))
         
      query = self.apply_condition(query)
      
      self.total = query.first()[0]
      return self.total
   
   def set_pagination(self, limit, offset):
      self.limit = limit
      self.offset = offset
      
   def get_posts(self):
      if self.total == 0:
         return (0, [])

      #generate base query
      if self.post_type == 'sell':
         query = SellingPost.query.options(db.joinedload('images'))
      elif self.post_type == 'buy':
         query = BuyRequest.query
      else:
         return (0, [])
      
      query = query.options(db.joinedload(Post.user).load_only('id', 'user_name', 'picture'))
      query = self.apply_condition(query)
      query = apply_order_query(query, self.order, Post)
      
      self.items = query.limit(self.limit).offset(self.offset).all()
      
      return (self.total, [i.to_json(user=None, get_chat=False, get_hashtags=False) for i in self.items])