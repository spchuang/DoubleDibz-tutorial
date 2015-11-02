from ..helpers import JsonSerializer, get_current_time,dump_datetime
from ..extensions import db
from . import constants as NOTIF
from ..constants import STRING_LEN, YES, NO

class NotificationJsonSerializer(JsonSerializer):
   __json_public__ = ['id', 'has_read',  'object_id']
   __json_modifiers__ = {
      'modified_at'      : ['modified_at', (lambda date: dump_datetime(date))],
      'action_type_code' : ['action_type', (lambda code : NOTIF.ACTION_TYPE[code])]
      }

class Notification(db.Model, NotificationJsonSerializer):
   __tablename__ = "notification"
   def __repr__(self):
      return '<Notification %r>' % (self.id)
      
   id            = db.Column(db.Integer, primary_key = True)
   user_id       = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)   
   #last actor that modified
   actor_id      = db.Column(db.Integer, db.ForeignKey("user.id"))
   object_id     = db.Column(db.Integer, nullable =False)
   count         = db.Column(db.Integer, default=1, nullable=False)
   has_read      = db.Column(db.SmallInteger, default=NO, nullable=False)
   modified_at   = db.Column(db.DateTime, nullable=False, default = get_current_time, onupdate=get_current_time)
    
   # ================================================================
   # object type
   
   object_type_code = db.Column(db.SmallInteger, default=NOTIF.POST, nullable=False)
   
   @property
   def object_type(self):
      return NOTIF.OBJECT_TYPE[self.object_type_code]  
   
   # ================================================================
   # Action type
   
   action_type_code = db.Column(db.SmallInteger, nullable=False)
   
   @property
   def action_type(self):
      return NOTIF.ACTION_TYPE[self.action_type_code]   

   # ================================================================ 
   # Methods
   def increment_count(self):
      self.count += 1
   
   def decrement_count(self):
      self.count -= 1
   
   def update_actor_id(self, actor_id):
      self.actor_id = actor_id
   
   def set_read(self):
      if self.has_read == NO:
         self.has_read = YES
         return True
      return False
   
   def set_unread(self):
      self.has_read = NO
   
   def is_read(self):
      return self.has_read == YES
   
   def updateTime(self):
      self.modified_at = get_current_time()
   
   def to_json(self):
      data = super(Notification, self).to_json()
      return data      
   
   # ================================================================ 
   # Class methods
   @classmethod
   def by_user_and_id(cls, user_id, id):
      return cls.query.filter_by(id=id, user_id=user_id).first()
   
   @classmethod
   def by_user_object_action(cls, user_id, object_id, object_type_code, action_type_code):
      return cls.query.filter_by(user_id=user_id, object_id=object_id, object_type_code=object_type_code, action_type_code=action_type_code).first()
   
   @classmethod
   def by_user_and_page(cls, user_id, per_page, page):
      query = cls.query.filter(Notification.user_id == user_id).order_by(Notification.modified_at.desc())
      result = query.paginate(page, per_page, False)
      return (result.total, result.items)
   

class NotificationAction(db.Model, NotificationJsonSerializer):
   __tablename__ = "notification_action"
      
   id               = db.Column(db.Integer, primary_key = True)
   actor_id         = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)   
   created_at       = db.Column(db.DateTime, nullable=False, default = get_current_time)

   # ================================================================
   # Action type
   
   action_type_code = db.Column(db.SmallInteger, nullable=False)
   
   @property
   def action_type(self):
      return NOTIF.ACTION_TYPE[self.action_type_code]      

class PostSubscribeJsonSerializer(JsonSerializer):
   __json_public__ = ['id', 'subscriber_id', 'post_id', 'status_code']
   __json_modifiers__ = {
      'status_code' : ['status', (lambda code : code)]
      }

class UserPostSubscribe(db.Model, PostSubscribeJsonSerializer):
   __tablename__ = "user_post_subscribe"
   
   id               = db.Column(db.Integer, primary_key = True)
   subscriber_id    = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
   post_id          = db.Column(db.Integer, db.ForeignKey("post.id"), nullable=False)
   
   # ================================================================
   # Subscribe Status
   
   status_code = db.Column(db.SmallInteger, default=NOTIF.SUBSCRIBED, nullable=False)
   
   # ================================================================ 
   # Class methods
   @classmethod
   def by_post_id(cls, post_id):
      return cls.query.filter_by(post_id=post_id).all()
   
   @classmethod
   def by_subscriber_and_post(cls, user_id, post_id):
      return cls.query.filter_by(subscriber_id=user_id, post_id=post_id).first()
   
class UserFollowerSubscribe(db.Model):
   __tablename__ = "user_follower_subscribe"
   
   id               = db.Column(db.Integer, primary_key = True)
   follower_id    = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
   user_id          = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

   # ================================================================
   # Subscribe Status
   
   status_code = db.Column(db.SmallInteger, default=NOTIF.SUBSCRIBED, nullable=False)
   
   @property
   def status(self):
      return NOTIF.SUBSCRIBE_STATUS[self.status_code] 
      
   # ================================================================ 
   # Class methods
   @classmethod
   def by_user_id(cls, user_id):
      return cls.query.filter_by(user_id=user_id).all()