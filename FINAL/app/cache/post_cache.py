from flask import current_app
import cPickle as pickle
from .helpers import _get_user_from_db, _get_users_from_db
from .constants import POST_KEY

def del_post(id):
   current_app.redis.delete(POST_KEY % id)