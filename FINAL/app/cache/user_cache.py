from flask import current_app
import cPickle as pickle
from .helpers import _get_user_from_db, _get_users_from_db

def get_user(id):
   '''
   redis = current_app.redis
   key = USER_KEY % id
   
   data = redis.get(key)
   if not data:
      data = _get_user_from_db(id)
      redis.set(key, pickle.dumps(data))
   else: 
      data = pickle.loads(data)
   
   t = _get_user_from_db(id)
   '''
   data = _get_user_from_db(id)
   return data
   