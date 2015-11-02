from .search import Search
from .fbsync_search import fbsync_search
from ..hashtags.constants import CATEGORIES
from ..hashtags import Hashtag
from ..extensions import db

class Aggr_search():
   '''
      Intelligently aggregate the results from both fbsync and our own posts
   '''
   def __init__(self, filters):
      self.page      = filters.get('page')
      self.per_page  = filters.get('per_page')
      self.order     = filters.get('order')
      
      #Magic numbers to determine how many from each table to retrieve (or not)
      self.total_at_least  = (self.page-1) * self.per_page + 1
      self.each_at_least   = (self.page-1) * self.per_page / 2 + 1 
      self.each_at_most    = (self.page * self.per_page)/2

      hashtag = filters['hashtag']
      filters['hashtag_id'] = []
      # get hashtag id (if necessary)
      if hashtag is not None:
         # parse multiple hashtags
         hashtag_list = [x.strip() for x in hashtag.split(',')]
         
         for name in hashtag_list:
            # check if hashtag is a category
            if name in CATEGORIES:
               filters['hashtag_id'].append(CATEGORIES[name])
            else:     
               q = db.select([Hashtag.id]).where(Hashtag.name == name)
               h_id = db.session.execute(q).first()
               # if hashtag exists
               if h_id:
                  filters['hashtag_id'].append(int(h_id[0]))
      

      self.normal_search = Search(filters)
      self.fbsync_search = fbsync_search(filters)
      self.filters   = filters
   def _count_posts(self):
      normal_count = 0
      fbsync_count = 0
      
      #count how many regular posts there are
      if self.normal_search.setup():
         normal_count = self.normal_search.count_posts()
         
      #count how many fbsync posts 
      fbsync_count = self.fbsync_search.count_posts()
      
      return normal_count, fbsync_count

   def get_single_table_items(self, get_normal, get_fbsync, normal_count, fbsync_count):
      '''
         Since we are only using one table now, we need to get the full range per page
      '''
      limit = self.per_page
      items = []
      
      if get_normal:
         offset = (self.total_at_least-1) - fbsync_count
         self.normal_search.set_pagination(limit, offset)
         total, items = self.normal_search.get_posts()
         
      elif get_fbsync:
         offset = (self.total_at_least-1) - normal_count
         self.fbsync_search.set_pagination(limit, offset)
         total, items = self.fbsync_search.get_posts()
      
      return items   
   
   def get_both_table_items(self, normal_count, fbsync_count):
      '''
         The tricky part is to count how many are we getting from each table
         Assumption: starting from the same offset
      '''
      offset = self.each_at_least -1
      
      #How many items are there from the offset      
      normal_has_left = normal_count - offset
      fbsync_has_left = fbsync_count - offset
      half            = self.per_page / 2
      
      normal_has_enough = normal_has_left >= half
      fbsync_has_enough = fbsync_has_left >= half

      '''
            There are 3 potential cases here
            1. both has enough
            2. normal has enough, fbsync doesn't
            3. normal doesn't have enough, fbsync does
            4. both doesn't 
      '''
      if normal_has_enough and fbsync_has_enough :
         #get half from each table
         normal_limit = fbsync_limit = half
         
      elif normal_has_enough and not fbsync_has_enough:
         #fbsync gets 
         fbsync_limit = fbsync_has_left
         
         diff = self.per_page - fbsync_limit
         normal_limit = diff if normal_has_left >= diff else normal_has_left
         
      elif not normal_has_enough and fbsync_has_enough:
         normal_limit = normal_has_left
         
         diff = self.per_page - normal_limit
         fbsync_limit = diff if fbsync_has_left >= diff else fbsync_has_left
      else:
         normal_limit = normal_has_left
         fbsync_limit = fbsync_has_left
      
      #Get results
      self.normal_search.set_pagination(normal_limit, offset)
      total, normal_items = self.normal_search.get_posts()
      
      self.fbsync_search.set_pagination(fbsync_limit, offset)
      total, fbsync_items = self.fbsync_search.get_posts()
      
      return normal_items + fbsync_items
      
   def order_posts(self, items):
      if self.order == 'date-desc':
         items.sort(key=lambda k: k['created_at'], reverse=True)
      elif self.order == 'price-asc':
         items.sort(key=lambda k: k['price'])
      elif self.order == 'price-desc':
         items.sort(key=lambda k: k['price'], reverse=True)
         
   def get_posts(self):
      '''
         Check if we EVEN need to touch fbsync
         - search by user
         - search by filter
         TODO: refactor this later
      '''         
      
      if self.filters.get('user_name') is not None or self.filters.get('src') == "us": 
         # only search in regular post table
         if self.normal_search.setup():
            self.normal_search.count_posts()
            total, items = self.normal_search.get_posts()
         else:
            total, items = 0, []
         return total, items
      elif self.filters.get('src') == "fb":
         self.fbsync_search.count_posts()
         total, items = self.fbsync_search.get_posts()
         return total, items
         
      return self.get_both_posts()
            
   def get_both_posts(self):
      '''
         return (total, result list)
      '''
      normal_count, fbsync_count = self._count_posts()
      #first check if we even have enough for the given page
      if normal_count + fbsync_count < self.total_at_least:
         return (normal_count + fbsync_count, [])
               
      # check if each table has enough
      get_normal = normal_count >= self.each_at_least
      get_fbsync = fbsync_count >= self.each_at_least
      
      #so we either get posts from BOTH tables, or only from ONE
      if get_normal and get_fbsync:
         items = self.get_both_table_items(normal_count, fbsync_count)
      else:
         items = self.get_single_table_items(get_normal, get_fbsync, normal_count, fbsync_count)
         
      #sort the posts
      self.order_posts(items)
         
      return normal_count + fbsync_count , items