from flask import current_app
import cPickle as pickle
from .helpers import _get_user_from_db, _get_users_from_db
from .constants import SEARCH_KEY, SEARCH_EXPIRES
from ..search import Search, fbsync_search, Aggr_search
from ..search.constants import ACCEPT_KEYS

def _create_key(filters):
   #create a shallow copy
   f = dict(filters)
   
   #set None to ''
   for key in ACCEPT_KEYS:
      if not f[key]:
         f[key] = ''   

   #'search:circle:type:hashtag:name:user_name:per_pag:page'
   return SEARCH_KEY % (f['circle'],
                        f['src'],
                        f['hashtag'],
                        f['name'],
                        f['user_name'],
                        f['status'],
                        f['type'],
                        f['from'],
                        filters['per_page'],
                        f['page'],
                        f['order'])
   
def _get_search_from_db(filters):
   #fall back to db 
   search = Aggr_search(filters)
   total, posts = search.get_posts()
   
   return {
      'total'     : total,
      'result'    : posts,
      'page'      : filters['page'],
      'per_page'  : filters['per_page']
   }


def get_search(filters):
   redis = current_app.redis
   
   key = _create_key(filters)
   #ping cache
   data = redis.get(key)
   data = pickle.loads(data) if data else None
   
   if not data: 
      data = _get_search_from_db(filters)
      redis.setex(key, SEARCH_EXPIRES, pickle.dumps(data))
      
   return data

   
   
   
   
   