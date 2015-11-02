from . import AppLoggedTestCase, API_ROOT


"""
Test Users API
"""

class TestUsers(AppLoggedTestCase):
   def __init__(self, *args, **kwargs):
      super(TestUsers, self).__init__(*args, **kwargs)
      self.USERS_ROOT = '/users'

   def test_auth(self):
      r = self.get(API_ROOT+'/account/verify_auth')
      self.assertOkJson(r)

   def test_get_user_private(self):
      r = self.get(API_ROOT+self.USERS_ROOT+"/1")
      self.assertOkJson(r)
      self.assertIn('"user_name": "%s"'   % self.demo_user.user_name, r.data)
      
   def test_get_bad_user(self):
      r = self.get(API_ROOT+self.USERS_ROOT+"/2")
      self.assertJsonError(r, 404, "Not Found")
      
   