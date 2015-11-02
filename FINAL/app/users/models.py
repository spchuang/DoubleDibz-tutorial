from werkzeug import generate_password_hash, check_password_hash
from flask.ext.login import UserMixin
from sqlalchemy.dialects.mysql import BIGINT

from ..helpers import JsonSerializer, get_current_time
from ..extensions import db
from ..emails import Email
from ..images.helpers import get_s3_link, add_thumb_ext
from . import constants as USER
from ..constants import STRING_LEN, EMAIL_LEN, PW_STRING_LEN, YES, NO, BOOLEAN
from sqlalchemy import exc
from ..circles.models import circle_user_rel

class UserJsonSerializer(JsonSerializer):
    __json_public__ = ['id', 'user_name', 'first_name', 'last_name']
    __json_modifiers__ = {
      'role_code' : ['role', (lambda code : USER.USER_ROLE[code])],
      'user_settings' : ['settings', (lambda s: s.to_json() )]
    }

class User(db.Model, UserMixin, UserJsonSerializer):

   __tablename__ = "user"
   def __repr__(self):
      return '<User %r>' % (self.user_name)

   id            = db.Column(db.Integer, primary_key = True)
   first_name    = db.Column(db.String(STRING_LEN), nullable=False)
   last_name     = db.Column(db.String(STRING_LEN), nullable=False)
   user_name     = db.Column(db.String(STRING_LEN),  index = True, unique = True, nullable=False)
   created_at    = db.Column(db.DateTime, nullable=False, default = get_current_time)
   picture       = db.Column(db.String(STRING_LEN))

   # ================================================================
   # User Password

   #a password could be empty IIF there exist a fb account
   _password = db.Column('password', db.String(PW_STRING_LEN), nullable= True)

   def _get_password(self):
      return self._password

   def _set_password(self, password):
      self._password = generate_password_hash(password)

   password = db.synonym('_password',
                          descriptor=property(_get_password,
                                              _set_password))

   def check_password(self, password):

      if self.password is None:
         return False
      return check_password_hash(self.password, password)

   # ================================================================
   # User role
   #change user to tester for now
   role_code = db.Column(db.SmallInteger, default=USER.TESTER, nullable=False)

   @property
   def role(self):
      return USER.USER_ROLE[self.role_code]


   def is_admin(self):
      return self.role_code == USER.ADMIN

   # ================================================================
   # User status
   status_code = db.Column(db.SmallInteger, default=USER.INACTIVE, nullable=False)

   @property
   def status(self):
      return USER.USER_STATUS[self.status_code]

   # ================================================================
   # Foreign key
   user_settings_id = db.Column(db.Integer, db.ForeignKey("user_settings.id"))

   # ================================================================
   # Relationships
   user_settings = db.relationship("UserSettings", uselist=False, backref="user")


   emails = db.relationship('Email', uselist=True, backref="user", lazy='dynamic')
   fb_account = db.relationship("UserFacebookAccount", uselist=False, backref="user")

   # ================================================================

   # ================================================================
   # methods

   #set private to true to only show basic user info
   def to_json(self, private=False):
      if not private:
         data = super(User, self).to_json()
         if self.fb_account is None:
            data['fb'] = 'disconnected'
         else:
            data['fb'] = 'connected'

         if self._password is None:
            data['fb_only'] = 'true'
         else:
            data['fb_only'] = 'false'
         data['circles'] = [{'id': i.id, 'name': i.name} for i in self.joined_circles]

      else:
         data = {
            'id'           : self.id,
            'user_name'    : self.user_name
         }

      data.update(self.get_picture())
      return data

   def to_basic_json(self):
      data = {
         'id': self.id,
         'user_name': self.user_name
      }
      data.update(self.get_picture())
      return data

   def get_picture(self):
      empty = {}
      if self.picture:
         empty['picture']       = get_s3_link(self.picture)
         empty['picture_thumb'] = get_s3_link(add_thumb_ext(self.picture))
      else:
         empty['picture'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-0R_P_wugPsAtd2Wwabo5pQKDQgkDgjFQ1g19JPUknk0KpdqA-g'
         empty['picture_thumb'] = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-0R_P_wugPsAtd2Wwabo5pQKDQgkDgjFQ1g19JPUknk0KpdqA-g'
      return empty

   def set_to_active(self):
      self.status_code = USER.ACTIVE

   def set_primary_email(self, email):
      self.primary_email.set_to_primary(yes=False)
      email.set_to_primary(yes=True)

   def add_email(self, email):
      #check if there is already a primary email..can't have more than one primary email
      if self.primary_email and email.is_it_primary():
         raise Exception('There can only be one primary email per user.')

      self.emails.append(email)

   def has_no_password(self):
      return self._password is None

   def is_member(self, circle):
      return self.joined_circles.filter(circle_user_rel.c.circle_id == circle.id).count() > 0

   @property
   def primary_email(self):
      return db.session.query(Email).filter(Email.user_id == self.id).filter(Email.is_primary==YES).first()


   # ================================================================
   # Class methods

   @classmethod
   def authenticate(cls, login, password):
      user = User.query.filter(db.or_(User.user_name == login)).first()

      if user:
         authenticated = user.check_password(password)
      else:
         authenticated = False
      return user, authenticated

   @classmethod
   def authenticate_fb(cls, fb_id):
      fb_account = UserFacebookAccount.query.filter(UserFacebookAccount.fb_id==fb_id).first()

      if fb_account:
         return fb_account.user

      return None

   @classmethod
   def is_user_name_taken(cls, user_name):
      return db.session.query(db.exists().where(User.user_name==user_name)).scalar()

   @classmethod
   def by_id(cls, id):
      return cls.query.filter(User.id==id).first()

   @classmethod
   def by_user_name(cls, user_name):
      return User.query.filter(User.user_name == user_name).first()

class UserSettingsJsonSerializer(JsonSerializer):
   __json_public__ = ['phone', 'bio', 'sex_code']


class UserSettings(db.Model, UserSettingsJsonSerializer):

   __tablename__ = "user_settings"

   id            = db.Column(db.Integer, primary_key = True)
   phone         = db.Column(db.String(STRING_LEN), nullable=True)
   bio           = db.Column(db.String(STRING_LEN), nullable=True)

   # send daily notifcaiton
   #fb_daily_notification = db.Column(db.SmallInteger, default=1, nullable=False)

   #show_fb_profile = db.Column(db.SmallInteger, default=0, nullable=False)

   # ================================================================
   # User gender

   #NOTE: might want to change this in the future
   sex_code = db.Column(db.SmallInteger, default=USER.MALE, nullable=False)

   @property
   def sex(self):
      return USER.USER_SEX[self.sex_code]

   created_at = db.Column(db.DateTime, default=get_current_time)

class UserFacebookAccount(db.Model):
   __tablename__ = 'user_facebook_account'

   id            = db.Column(db.Integer, primary_key = True)
   fb_id         = db.Column(BIGINT(unsigned=True),  unique = True, nullable=False)
   user_id       = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
   created_at    = db.Column(db.DateTime, nullable=False, default = get_current_time)
   modified_at   = db.Column(db.DateTime, nullable=False, default = get_current_time, onupdate=get_current_time)
   access_token  = db.Column(db.Text, nullable=True, default=None)
   expires_at    = db.Column(db.DateTime, nullable=True)

   # ================================================================
   # Class methods
   @classmethod
   def is_fb_id_taken(cls, fb_id):
      return db.session.query(db.exists().where(UserFacebookAccount.fb_id==fb_id)).scalar()

   @classmethod
   def by_user_id(cls, user_id):
      return cls.query.filter_by(user_id = user_id).first()

   @classmethod
   def by_fb_id(cls, fb_id):
      return cls.query.filter_by(fb_id = fb_id).first()

   @classmethod
   def get_all_unexpired(cls):
      users = cls.query.options(db.load_only('fb_id')).\
         filter(cls.expires_at > get_current_time()).all()

      return [i.fb_id for i in users]

class UserCircleAuth(db.Model):
   __tablename__ = 'user_circle_auth'

   id            = db.Column(db.Integer, primary_key = True)
   user_id       = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
   circle_id     = db.Column(db.Integer, db.ForeignKey("circle.id"), nullable=False)
   source        = db.Column(db.String(STRING_LEN), nullable=False)

   db.UniqueConstraint('user_id', 'circle_id', source)

   # ================================================================
   # Class methods
   @classmethod
   def by_user_and_circle(cls, user, circle):
      return cls.query.filter(UserCircleAuth.user_id == user.id, UserCircleAuth.circle_id==circle.id).first()

   @classmethod
   def by_user_email_src(cls, user, email):
      return cls.query.filter(UserCircleAuth.user_id == user.id, UserCircleAuth.source == email).first()

   @classmethod
   def by_user_circle_not_temp(cls, user, circle):
      return cls.query.filter(UserCircleAuth.user_id == user.id, UserCircleAuth.circle_id == circle.id, UserCircleAuth.source!="temp").first()
