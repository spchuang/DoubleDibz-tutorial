from flask.ext.login import current_user
from ..extensions import db
from ..fbsync.models import FBFeed, FBFeedImage, feed_hashtag_rel
from ..fbsync.constants import SELLING, BUYING, PUBLISHED
from ..hashtags.constants import CATEGORIES
from ..posts import PostBookmark, SOURCE_FB
from .helpers import get_search_time, apply_order_query
from sqlalchemy.sql import or_, and_, func

from .constants import POST_TYPE_SELL

class fbsync_search():
   '''
      We can search by message
   '''
   def __init__(self, filters):
      self.columns = []
      
      self.description  = filters.get('name')
      self.hashtag_id   = filters.get('hashtag_id')
      self.hashtag      = filters.get('hashtag')
      self.order        = filters.get('order')
      #TEMPORARY
      self.post_type    = filters.get('type')
      self.per_page     = filters.get('per_page')
      self.page         = filters.get('page')
      
      self.time         = get_search_time(filters.get('from'))

      self.limit  = self.per_page
      self.offset = (self.page - 1) * self.per_page
      
      if self.description:
         self.description = self.description.lower()
         
      self.tempPostId = []
          
   def apply_condition(self, query):
      #filter by publish and selling
      query = query.filter(FBFeed.status == PUBLISHED)
      
      if self.post_type == POST_TYPE_SELL:
         query = query.filter(FBFeed.post_type == SELLING)
      else:
         query = query.filter(FBFeed.post_type == BUYING)
      
      if self.hashtag_id: 
         
         num_hashtag = len(self.hashtag_id)
         if num_hashtag == 1:
            query = query.join(feed_hashtag_rel)
            query = query.filter(feed_hashtag_rel.c.hashtag_id.like(self.hashtag_id[0]))
         else:         
            # relational division (this is prob ALOT slower)
            
            if not self.tempPostId:
               # get the ids of post that have the hashtags
               q = db.select([feed_hashtag_rel.c.post_id])\
                  .where(feed_hashtag_rel.c.hashtag_id.in_(self.hashtag_id))\
                  .group_by(feed_hashtag_rel.c.post_id)\
                  .having(func.count(feed_hashtag_rel.c.hashtag_id) == num_hashtag)
            
               self.tempPostId = [row[0] for row in db.session.execute(q).fetchall()]
            
            query = query.filter(FBFeed.id.in_(self.tempPostId))
            #temp = db.session.query(FBFeed).join(feed_hashtag_rel).filter(feed_hashtag_rel.c.hashtag_id.in_(self.hashtag_id))
            

      if self.description is not None: 
         query = query.filter(FBFeed.description.ilike('%'+self.description+'%'))
      
      if self.time is not None:
         query = query.filter(FBFeed.created_at > self.time)
      
      return query
          
   def count_posts(self):
      # if hashtag_id is None, no POST
      if self.hashtag and self.hashtag_id is None: 
         self.total = 0
         return self.total
         
      query = db.session.query(db.func.count(FBFeed.id))
      query = self.apply_condition(query)
      
      print query.first()
      
      self.total = query.first()[0]
      
      return self.total
      
   def set_pagination(self, limit, offset):
      self.limit = limit
      self.offset = offset
   
   '''
   #Have to add price first
   def order_query(self, query):
      order = self.order.split('-')
      order_lookup = {
         'create': FBFeed.created_at,
         'price': FBFeed.price
      }
      order_type = order[0]
      order = order[1]
      if order == 'asc':
         return query.order_by(order_lookup[order_type].asc())
      else:
         return query.order_by(order_lookup[order_type].desc())   
   '''
         
   def get_posts(self):
      #generate base query
      query = db.session.query(FBFeed).options(db.joinedload(FBFeed.images)).\
                           options(db.load_only('created_at', 'description', 'feed_id', 'price'))\
                           .options(db.joinedload(FBFeed.hashtags))
      
      
      query = self.apply_condition(query) 
      query = apply_order_query(query, self.order, FBFeed)
      #query = order_query(query)
      
      #add pagination
      self.items = query.limit(self.limit).offset(self.offset).all()
      
      return (self.total, [i.to_json() for i in self.items])

   