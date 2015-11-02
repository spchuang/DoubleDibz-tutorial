from flask.ext.testing import TestCase 
import gc

from utils import FlaskTestCaseMixin

from app import create_app
from app.extensions import db
from app.config import TestConfig
from app.users import User, UserSettings, ADMIN, ACTIVE, USER, MALE
from app.hashtags import Hashtag, CATEGORIES
from app.emails import Email, VERIFIED, EMAIL_STATUS
from app.circles import Circle
from flask import json

API_ROOT =  TestConfig.API_ROOT 




class AppTestCase(TestCase, FlaskTestCaseMixin):

   def create_app(self):
      """Create and return a testing flask app."""
      app = create_app(TestConfig)
      app.login_manager.init_app(app)
      return app
      
   def __call__(self, result=None):
      self.app = self._ctx = self.client = self.templates = None
      super(AppTestCase, self).__call__(result)
      
      
   def init_data(self):
      #default test user
      demo =User(
            first_name=u'demo',
            last_name=u'demo',
            user_name=u'demo',
            password=u'123456',
            role_code=ADMIN,
            status_code=ACTIVE,
            user_settings=UserSettings(
                sex_code=MALE,
                phone='555-555-5555',
                bio=u'just a demo guy'))
      email = Email(address= "demo@example.com", is_primary=True, status_code=VERIFIED) 
      demo.add_email(email)
      
      db.session.add(demo)
      db.session.add(email)
      db.session.commit()
      
      """Add in post categories"""
      for c in CATEGORIES:
         hashtag = Hashtag(name = c)      
         db.session.add(hashtag)
      db.session.commit()
      
      self.demo_user= demo
      
      '''Add in circles'''
      ucla = Circle(name=u'ucla', description=u'ucla.edu emails only')
      ucla.add_member(demo)
      db.session.add(ucla)
      db.session.commit()
      
   def setUp(self):
      """Reset all tables before testing."""
      db.create_all()
      self.init_data()
   
   def tearDown(self):
      """Clean db session and drop all tables."""
      db.drop_all()
 
      
   def login(self, username, password):
      data = {
         'login': username,
         'password': password,
      }
      
      return self.jpost(API_ROOT+'/auth/login', data=data, follow_redirects=False)
      
   def logout(self):
      response = self.client.post(API_ROOT+'/auth/logout')
      return response
      
   def _test_get_request(self, endpoint, template=None):
      response = self.client.get(endpoint)
      print response
      self.assert_200(response)
      if template:
         self.assertTemplateUsed(name=template)
      return response
     
class AppLoggedTestCase(AppTestCase):
   def setUp(self):
      super(AppLoggedTestCase, self).setUp()
      self.login('demo', '123456')
   