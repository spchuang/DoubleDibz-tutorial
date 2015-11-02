from ..chat import Chat
from ..posts import Post
from ..images import Image
from ..users import User
from ..extensions import db
from sqlalchemy.sql import or_

def get_time_delta(hours=0, mins=0, secs=0):
   return secs + 60 * mins + 60 * 60 * hours
   
   
def _get_id(key):
   return key.split(":")[1]

'''
   Helpers for DB fallback retrieval
'''

def _get_user_chats_from_db(user_id):
   '''
      select chat_id, post_id for all chats belonging to the user
      TODO: add pagination
   '''
   q = db.select([Chat.id, Chat.static_post_id, Chat.post_id]).\
         where(or_(Chat.owner_id == user_id, Chat.contact_id == user_id))
   return db.session.execute(q).fetchall()
  
   
def _get_chats_from_db(ids):
   return [i.to_json(user_id=None,get_messages = False) for i in Chat.by_ids(ids)]
 
 
def _get_posts_from_db(ids):
   '''
      All we want really is the post name and images
   '''
   #returns first image?
   query = db.session.query(Post).outerjoin(Image).with_entities(Post.id, Post.name, Image).\
                                  filter(Post.id.in_( ids )).group_by(Post.id)

   return [{'id': i[0], 'name':i[1], 'image': i[2].to_json() if i[2] else None} for i in query.all()]
   
   
   
def _get_user_from_db(id):
   return User.query.get(id)
      
def _get_users_from_db(ids):
   q = db.select(
         [User.id, User.user_name], 
         User.id.in_(ids)
      )
   return db.session.execute(q).fetchall()      