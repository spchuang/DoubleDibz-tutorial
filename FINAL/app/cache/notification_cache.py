from flask import current_app
import cPickle as pickle
from ..extensions import db
from ..notifications import Notification
from ..notifications.helpers import create_post_notification_message

from .helpers import _get_id,_get_posts_from_db, _get_users_from_db
from .constants import USER_NAME_KEY, POST_KEY, NOTI_COUNT_KEY, NOTI_COUNT_EXPIRES, DAILY_EXPIRE
from ..constants import YES, NO

from sqlalchemy.sql import and_, func

'''
   user:[id]:notification: the most 100 recent notifications
   user:[id]:notification:count 
   
   
   Case when states are compromised:
      - new notification inserted
      - old notification read
'''

def _get_notification_detail(notifications):
   redis = current_app.redis
   
   #get a list of user_ids and post_ids (remoe duplicates)
   user_ids = list(set([i.actor_id for i in notifications]))
   post_ids = list(set([i.object_id for i in notifications]))
   
   p = redis.pipeline()
   for id in user_ids:
      p.get(USER_NAME_KEY % id)
   for id in post_ids:
      p.get(POST_KEY % id)
   r = p.execute()
   
   
   #parse result from redis, check if any post or chat data are missing
   u_result, p_result   = {}, {}
   missing_u, missing_p = [], []
   
   i = 0
   for id in user_ids:
      u_result[id] = pickle.loads(r[i]) if r[i] else None
      if not r[i]:
         missing_u.append(id)
      i+=1
      
   for id in post_ids:
      p_result[id] = pickle.loads(r[i]) if r[i] else None
      if not r[i]:
         missing_p.append(id)
      i+=1
   
   #if chat or posts is missing, fall back to db query
   if missing_u:
      u_from_db = _get_users_from_db(missing_u)
      for i in u_from_db:
         u_result[i[0]] = i[1]
      
   if missing_p:
      p_from_db = _get_posts_from_db(missing_p)
      for i in p_from_db:
         p_result[i['id']] = i
         
   return u_result, p_result, missing_u, missing_p

def _construct_notification(notifications, u_result, p_result):
   data = []
   for n in notifications:
      d = n.to_json()
      #handle deleted post
      if p_result[n.object_id]:
         d['message'] = create_post_notification_message(n.action_type_code, n.count, u_result[n.actor_id], p_result[n.object_id]['name'], n.object_id)
      else:
         d['message'] = create_post_notification_message(n.action_type_code, n.count, u_result[n.actor_id], '[Deleted post]', n.object_id)
      data.append(d)
   return data
   
def _save_data(u_result, p_result, missing_u, missing_p):
   redis = current_app.redis
   p = redis.pipeline()
   if missing_u:
      for i in missing_u:
         k = USER_NAME_KEY % i
         p.setex(k, DAILY_EXPIRE, pickle.dumps(u_result[i]))      
   if missing_p:
      for i in missing_p:
         k = POST_KEY % i
         p.setex(k , DAILY_EXPIRE, pickle.dumps(p_result[i]))  
   p.execute()

def get_notification(user_id, page, per_page):
   #get a list of notifications
   total, notifications = Notification.by_user_and_page(user_id, per_page, page)
   
   #get user and post detail
   u_result, p_result, missing_u, missing_p = _get_notification_detail(notifications)
   
   #construct notification
   data = _construct_notification(notifications, u_result, p_result)

   #save 
   _save_data(u_result, p_result, missing_u, missing_p)
   
   return total, data
   
   
def _calculate_total_count(user_id):
   q = db.select([func.count()]).select_from(Notification).\
         where(and_(Notification.user_id == user_id, Notification.has_read == NO ))
   return db.session.execute(q).scalar()
   
def get_notification_unread_count(user_id):
   redis = current_app.redis
   key = NOTI_COUNT_KEY % user_id
   
   data = redis.get(key)
   if not data: 
      data = _calculate_total_count(user_id)
      redis.setex(key, NOTI_COUNT_EXPIRES, int(data))
   return data
   
def decr_notification_count(user_id):
   redis = current_app.redis
   key = NOTI_COUNT_KEY % user_id
   if redis.get(key) > 0:
      redis.decr(key)
   
def incr_notication_count(user_id):
   current_app.redis.incr(NOTI_COUNT_KEY % user_id)
   
