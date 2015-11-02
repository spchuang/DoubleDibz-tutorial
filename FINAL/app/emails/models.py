from uuid import uuid4
from ..helpers import JsonSerializer, get_current_time, get_current_time_plus
from ..extensions import db
from . import constants as EMAIL
from ..constants import STRING_LEN, EMAIL_LEN, YES, NO, BOOLEAN


class EmailJsonSerializer(JsonSerializer):
   __json_public__ = ['id', 'address', 'is_primary']
   __json_modifiers__ = {
      'status_code' : ['status', (lambda code : EMAIL.EMAIL_STATUS[code])]
    }
   pass

class Email(db.Model, EmailJsonSerializer):
   __tablename__ = "email"
   def __repr__(self):
      return '<Email %r %s>' % (self.id , self.address)
   id = db.Column(db.Integer, primary_key = True)
   
   address     = db.Column(db.String(EMAIL_LEN), index = True, unique=True, nullable=False)
   created_at  = db.Column(db.DateTime, nullable=False, default = get_current_time)
      
   def __init__(self, address, is_primary=False, status_code=None):
      self.address     = address
      if is_primary:
         self.is_primary = YES
      else:
         self.is_primary = NO
      if status_code is not None:
         self.status_code = status_code
   
   
   # ================================================================
   # Email status
   status_code   = db.Column(db.SmallInteger, default=EMAIL.UNVERIFIED, nullable=False)
   @property
   def status(self):
      return EMAIL.EMAIL_STATUS[self.status_code]
      
   # ================================================================
   # Primary email
   is_primary    = db.Column(db.SmallInteger, default=NO, nullable=False)
      
   # ================================================================
   # One-to-one (uselist=False) relationship between users and user_settings.
   user_id     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
   
   #cascade delete: http://stackoverflow.com/questions/5033547/sqlachemy-cascade-delete
   auth_actions = db.relationship("EmailAuthAction", backref="email_ref",  cascade="all,delete", uselist=True)
   
   # ================================================================
   # methods
   def set_to_primary(self, yes=True):
      if yes:
         self.is_primary = YES
      else:
         self.is_primary = NO
      
         
   def set_to_verified(self, yes=True):
      if yes:
         self.status_code = EMAIL.VERIFIED
      else:
         self.status_code = EMAIL.UNVERIFIED
         
   #lol hacky name 
   def is_it_primary(self):
      return self.is_primary == YES
      
      
   # ================================================================
   # Class methods
   @classmethod
   def by_id(cls, id):
      return cls.query.filter(Email.id==id).first()
   
   @classmethod
   def by_user(cls, user):
      return cls.query.filter(Email.user_id == user.id).all()
      
   @classmethod
   def by_user_and_id(cls, user, id):
      return cls.query.filter(Email.id ==id).filter(Email.user_id == user.id).first()

   @classmethod
   def by_address(cls, address):
      return cls.query.filter(Email.address==address).first()
   

   @classmethod
   def is_email_taken(cls, email_address):
      return db.session.query(db.exists().where(Email.address==email_address)).scalar()

'''
   This table stores the necessary email actions like user activation and password resets
'''
class EmailAuthAction(db.Model):
   __tablename__ = "email_auth_action"
   def __repr__(self):
      return '<Email Action %r %s>' % (self.id, self.email)
   id = db.Column(db.Integer, primary_key = True)
   activation_key = db.Column(db.String(STRING_LEN), nullable = False, unique = True)
  
   action_code = db.Column(db.SmallInteger, nullable=False)
   expire_at   = db.Column(db.DateTime, nullable=False)
   created_at  = db.Column(db.DateTime, nullable=False, default = get_current_time)
   email       = db.Column(db.String(EMAIL_LEN), db.ForeignKey("email.address"), nullable=False)
   
   def __init__(self, user, action_code, email):
      #check if action_code isn't define
      if(action_code != EMAIL.ACTIVATE_USER and action_code != EMAIL.RESET_PASSWORD and action_code != EMAIL.VERIFY_EMAIL):
         raise Exception('Action code is invalid!')
      
      self.activation_key = str(uuid4())
      self.user_id      = user.id
      self.action_code  = action_code
      self.expire_at = get_current_time_plus(hours= EMAIL.EXPIRATION_HOURS)
      self.email     = email
        
   # ================================================================
   # One-to-one (uselist=False) relationship between users and user_settings.
   user_id     = db.Column(db.Integer, db.ForeignKey("user.id"))
   user        = db.relationship("User", uselist=False)

   @property
   def action(self):
      return EMAIL.EMAIL_ACTION[self.action_code]
      
   # ================================================================
   # methods
   def isExpired(self):
      return self.expire_at < get_current_time()
      
   # ================================================================
   # Class methods
   @classmethod
   def by_user(cls, user):
      return cls.query.filter(EmailAuthAction.user_id == user.id).all()
      
   @classmethod
   def by_email_and_user(cls, email, user):
      return cls.query.filter(EmailAuthAction.email == email.address).filter(EmailAuthAction.user_id == user.id).all()
      
   @classmethod
   def by_key_action_email(cls,key, action,email):
      return cls.query.filter(EmailAuthAction.activation_key == key).\
               filter(EmailAuthAction.action_code == action).filter(EmailAuthAction.email==email).first()
               
   @classmethod
   def by_id(cls, id):
      return cls.query.filter_by(id=id).first()
      