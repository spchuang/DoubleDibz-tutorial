from flask import current_app
import cPickle as pickle
from .constants import INBOX_KEY, POST_KEY, CHAT_KEY, INBOX_EXPIRES, DAILY_EXPIRE
from .helpers import _get_user_chats_from_db, _get_id, _get_chats_from_db, _get_posts_from_db, get_time_delta

REMOVE_COLS = ['owner_id', 'contact_id', 'owner_read', 'contact_read']

'''
   Data should be invalidated in the following conditions:s
   - new chat created
   - chat read (update modified_at and read status)
   - post name changes
   
   FLAT SCHEMA
   user:[id]:inbox -> stores tuple(chat:id, post:id, post_id)
   chat:[id] -> store the whole thing
   post:[id] -> only store name and first image (thumbnail)
      
   - new chat created ( insert to user inbox)
   - update chat (update chat)

'''
  
def _remove_keys(data, keys):
   d = dict(data)
   for k in keys:
      del d[k]
   return d
  
def _construct_inbox(c_result, p_result, user_id):
   data ={}
   
   for key, c in c_result.iteritems():
      if c['owner_id'] == user_id:
         c['read'] = c['owner_read']
      elif c['contact_id'] == user_id:
         c['read'] = c['contact_read']
         
      post_id = c['static_post_id']

      #if post isn't there, create it
      if post_id not in data:
         
         #handle deleted post
         post_meta = p_result[POST_KEY % post_id]
         if post_meta:
            data[post_id] = dict(post_meta)
         else:
            data[post_id] = { 'id': None, 'name' : 'Post deleted', 'image' : None }
         data[post_id]['chats'] = []
      
      new_c = _remove_keys(c, REMOVE_COLS)
      
      data[post_id]['chats'].append(new_c)

   return data
      
def _get_user_inbox(user_id):
   '''
      Return user:[id]:inbox, reset
      - stores tuple (chat:[id], post[id], post foriegn key)
      - foreign key is used to detect deleted posts
   '''
   redis = current_app.redis
   inbox_key = INBOX_KEY % user_id
   
   #get list of chats from inbox
   keys = redis.get(inbox_key)
   if not keys:
      _ids = _get_user_chats_from_db(user_id)
      keys = [(CHAT_KEY % i[0], POST_KEY % i[1], i[2]) for i in _ids]
      return keys, True

   return pickle.loads(keys), False

def _get_user_inbox_detail(keys, user_id):
   '''
      return 2 arrays for chat/post data, 2 arrays for ids to reset
   '''
   #first retrieve data from redis
   redis = current_app.redis
   chat_keys = list(set([i[0] for i in keys]))
   post_keys = list(set([(i[1], i[2]) for i in keys])) #NOTE: tuple is (POST:id, foreign post id), i[1] is None when post is removed 
   
   p = redis.pipeline()
   for key in chat_keys:
      p.get(key)
   for key in post_keys:
      p.get(key[0])
   r = p.execute()
   
   #parse result from redis, check if any post or chat data are missing
   c_result, p_result   = {}, {}
   missing_c, missing_p = [], []
  
   i = 0
   for key in chat_keys:
      c_result[key] = pickle.loads(r[i]) if r[i] else None
      if not r[i]:
         missing_c.append( _get_id(key) )
      i+=1
      
   for key in post_keys:
      p_result[key[0]] = pickle.loads(r[i]) if r[i] else None
      if not r[i] and key[1]:
         missing_p.append( _get_id(key[0]))
      i+=1
      
   #if chat or posts is missing, fall back to db query
   if missing_c:
      c_from_db = _get_chats_from_db(missing_c)
      for i in c_from_db:
         c_result[CHAT_KEY % i['id']] = i
      
   if missing_p:
      p_from_db = _get_posts_from_db(missing_p)
      for i in p_from_db:
         p_result[POST_KEY % i['id']] = i

   return c_result, p_result, missing_c, missing_p


def _set_inbox(user_id, keys, reset_inbox, missing_c, missing_p, c_result, p_result):
   redis = current_app.redis
   #finally, insert anything new with an atomic transaction
   p = redis.pipeline()
   if reset_inbox:
      p.setex(INBOX_KEY % user_id, INBOX_EXPIRES, pickle.dumps(keys))
   
   if missing_c:
      for i in missing_c:
         k = CHAT_KEY % i
         p.set(k, pickle.dumps(c_result[k]))      
   if missing_p:
      for i in missing_p:
         k = POST_KEY % i
         p.setex(k, DAILY_EXPIRE, pickle.dumps(p_result[k]))  
   
   p.execute()


def get_inbox(user_id):
   '''
      Cached Inbox
   '''
   #get list of chats from inbox
   keys, reset_inbox = _get_user_inbox(user_id)

   #retrieve all the posts data and chat data (remove duplicate)
   c_result, p_result, missing_c, missing_p = _get_user_inbox_detail(keys, user_id)
   
   #construct the data
   data = _construct_inbox(c_result, p_result, user_id)
  
   #reset any data that weren't initially in redis
   _set_inbox(user_id, keys, reset_inbox, missing_c, missing_p, c_result, p_result)

   return data

   
'''
   Public functions to reset cache

'''
def del_inbox(user_id):
   current_app.redis.delete(INBOX_KEY % user_id)
   
def reset_chat(user_id, chat):
   data = chat.to_json(user_id = None , get_messages = False)
   current_app.redis.set(CHAT_KEY % chat.id, pickle.dumps(data))
