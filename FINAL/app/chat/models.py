from ..helpers import JsonSerializer, get_current_time, dump_datetime
from ..extensions import db
from . import constants as MESSAGES
from ..posts import Post
from ..images import Image
from ..constants import STRING_LEN, YES, NO, BOOLEAN

class ChatJsonSerializer(JsonSerializer):
   __json_public__ = ['id', 'post_id', 'owner_name', 'contact_name', 'static_post_id']
   __json_modifiers__ = {
      'created_at'  : ['created_at', (lambda date: dump_datetime(date))],
      'modified_at' : ['modified_at', (lambda date: dump_datetime(date))]
      
   }

class Chat(db.Model, ChatJsonSerializer):
   '''
      This is an offer requests between owner of the post and the user who contacted.
   '''
   __tablename__ = "chat"
   def __repr__(self):
      return '<Chat %r for post %r by user %r>' % (self.id, self.post_id, self.contact_id)
      
   id            = db.Column(db.Integer, primary_key = True)
   post_id       = db.Column(db.Integer, db.ForeignKey("post.id"))  
   
   #this is used 
   static_post_id  = db.Column(db.Integer, nullable=False,) 
   created_at    = db.Column(db.DateTime, nullable=False, default = get_current_time)
   modified_at   = db.Column(db.DateTime, nullable=False, default = get_current_time)

   owner_id     = db.Column(db.Integer, db.ForeignKey("user.id"))  
   contact_id   = db.Column(db.Integer, db.ForeignKey("user.id"))  
   
   owner_name    = db.Column(db.String(STRING_LEN),  nullable=False)
   contact_name  = db.Column(db.String(STRING_LEN),  nullable=False)
   
   # read status
   owner_read    = db.Column(db.SmallInteger, nullable=False)
   contact_read  = db.Column(db.SmallInteger, nullable=False)
   
   # Relationships
   messages = db.relationship('ChatMessage', uselist=True, backref="chat", cascade="all,delete", lazy='dynamic') 

   #constructor
   def __init__(self, contact_user):
      self.contact_id   = contact_user.id
      self.contact_name = contact_user.user_name
      #an initial chat is sent by buyer so seller hasn't read it while buyer has.
      self.owner_read = NO
      self.contact_read  = YES

   # ================================================================ 
   # Methods
   def add_message(self, message):
      self.messages.append(message)
      
   def updateTime(self):
      self.modified_at = get_current_time()
   
   def to_json(self, user_id=None, get_messages=True):
      '''
         If we specify user_id, return the specified chat, if not, return the entire row.
      '''
      
      data = super(Chat, self).to_json()
      if get_messages:
         data['messages'] = [i.to_json() for i in self.messages] 
      
      if user_id:
         if self.owner_id == user_id:
            data['read'] = self.owner_read
         elif self.contact_id == user_id:
            data['read'] = self.contact_read
      else:
         #include all columns
         data['owner_id']    = self.owner_id
         data['contact_id']  = self.contact_id
         data['owner_read']  = self.owner_read
         data['contact_read']= self.contact_read
         
        
      return data
      
   def set_self_read(self, user):
      '''
         This will set the current user to read for the chat only if the chat was unread before. (the user can either be seller or buyer).
         returns True if needs to commit, else false
         
      '''
      
      if self.owner_id == user.id and self.owner_read == NO:
         self.owner_read = YES
         return True
      elif self.contact_id == user.id and self.contact_read == NO:
         self.contact_read = YES
         return True
      return False
   
   
      
   def set_other_unread(self, user):
      '''
         This does the opposite of 'set_read'. It sets the 'other user' to unread, since this method should be called after the current user sends out a message. The other person is 'unread'.
      '''   
      if self.owner_id == user.id and self.contact_read == YES:
         self.contact_read = NO
      elif self.contact_id == user.id and self.owner_read == YES:
         self.owner_read = NO
      
      
   # ================================================================ 
   # Class methods
   @classmethod
   def by_id(cls, chat_id):
      return cls.query.filter(Chat.id==chat_id).first()
      
   @classmethod
   def by_user(cls, user_id):
      '''
         FALL BACK FUNCTION.
         return all chats where the user is either the seller or the buyer. 
         Group by {'selling', 'buying'} and in each, have post 
         
      '''

      chats = cls.query.filter((Chat.owner_id== user_id) | (Chat.contact_id== user_id)).all()
      
      data = {'selling':{}, 'buying':{}}
      get_messages = False
      for c in chats:
         if c.owner_id == user_id:
            if c.static_post_id not in data['selling']:
               data['selling'][c.static_post_id] = get_chat_post(c)
                       
            data['selling'][c.static_post_id]['chats'].append(c.to_json(user_id = user_id, get_messages=get_messages))
         else:
            if c.static_post_id not in data['buying']:
               data['buying'][c.static_post_id] = get_chat_post(c)
               
            data['buying'][c.static_post_id]['chats'].append(c.to_json(user_id = user_id, get_messages=get_messages))      
      
      return data

   @classmethod
   def by_post_id(cls, post_id):
      return cls.query.filter(Chat.post_id==post_id).first()
   
   @classmethod
   def by_user_and_id(cls, user, id):
      chat= cls.query.filter(Chat.id ==id).first()
      if(chat and (chat.contact_id == user.id or chat.owner_id == user.id)):
         return chat
      return None
      
   @classmethod
   def by_ids(cls, ids):
      return cls.query.filter(Chat.id.in_( ids )).all()

def get_chat_post(c):
    #if post doesn't exist anymore
   if c.post_id:
      post_info = {
         'id'   : c.post.id,
         'name' : c.post.name,
         'image': c.post.images[0].to_json() if len(c.post.images)>0 else "",
         'chats': []
      }
   else:
      post_info = {
         'id'    : None,
         'name'  : 'Post deleted',
         'image' : None,
         'chats': []
      }
   return post_info
                        
class ChatMessageJsonSerializer(JsonSerializer):
   __json_public__ = ['id', 'chat_id', 'created_by', 'type', 'body']
   __json_modifiers__ = {
      'created_at'  : ['created_at', (lambda date: dump_datetime(date))],
   }

class ChatMessage(db.Model, ChatMessageJsonSerializer):
   '''
      This is for the actual individual messages in the conversation between the seller and the buyer.   
   '''
   __tablename__ = "chat_messages"
   def __repr__(self):
      return '<ChatMessages %r>' % (self.id)
   
   #constructor
   def __init__(self, body, created_by):
      self.body     = body  
      self.created_by = created_by
      
   id            = db.Column(db.Integer, primary_key = True)
   chat_id       = db.Column(db.Integer, db.ForeignKey("chat.id"), nullable=False)  
   created_at    = db.Column(db.DateTime, nullable=False, default = get_current_time)
   created_by    = db.Column(db.Integer, db.ForeignKey("user.id"))  
   type          = db.Column(db.SmallInteger, default=MESSAGES.TEXT, nullable=False)
   body          = db.Column(db.String(MESSAGES.LENGTH), nullable = False)
                     
                     