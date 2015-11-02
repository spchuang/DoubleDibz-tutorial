from werkzeug import generate_password_hash, check_password_hash
from flask.ext.login import UserMixin
from sqlalchemy.dialects.mysql import BIGINT

from app.extensions import db
from app.constants import STRING_LEN, PW_STRING_LEN
from . import constants as CONSTANTS

class AdminUser(db.Model, UserMixin):
   __bind_key__ = 'internal'
   __tablename__ = "admin"
   def __repr__(self):
      return '<User %r>' % (self.user_name)
      
   id            = db.Column(db.Integer, primary_key = True)
   username      = db.Column(db.String(STRING_LEN),  index = True, unique = True, nullable=False)
   password      = db.Column('password', db.String(PW_STRING_LEN), nullable= True)
   

   def set_password(self, password):
      self.password = generate_password_hash(password)
   
   def check_password(self, password):
      
      if self.password is None:
         return False
      return check_password_hash(self.password, password)
        
   # ================================================================
   # User role
   #change user to tester for now 
   role_code = db.Column(db.SmallInteger, nullable=False)
   
   @property
   def role(self):
      return USER.USER_ROLE[self.role_code]
   
   def is_admin(self):
      return self.role_code == CONSTANTS.ADMIN

   # ================================================================
   # Class methods
 
   @classmethod
   def authenticate(cls, username, password):
      user = cls.query.filter(db.or_(AdminUser.username == username)).first() 
      
      if user:
         authenticated = user.check_password(password)
      else:
         authenticated = False
      
      return user, authenticated
   
   @classmethod
   def by_id(cls, id):
      return cls.query.filter(AdminUser.id == id).first()