from . import AppTestCase, API_ROOT

"""
Test authentication API
"""

class TestAuth(AppTestCase):
   def __init__(self, *args, **kwargs):
      super(TestAuth, self).__init__(*args, **kwargs)
      self.test_data = {
         'user_name': 'test',
         'first_name': 'test',
         'last_name': 'test',
         'email': 'test@test.com',
         'password': 'testing',
         'confirm': 'testing',
      }
   def test_verify_auth(self):
      r = self.get(API_ROOT+'/account/verify_auth')
      self.assertJsonStatusCode(r, 401)
      self.assertIn('"errors"', r.data)
      
   def test_login(self):
      r = self.login('demo', '123456')
      r = self.get(API_ROOT+'/account/verify_auth')
      self.assertOkJson(r)
      self.assertIn('"user_name": "demo"', r.data)
      
   def test_login_wrong(self):
      r = self.login('demo', 'noope')
      self.assertJsonStatusCode(r, 422)
      self.assertIn('"errors"', r.data)

   def test_logout(self):
      self.login('demo', '123456')
      self.logout()
      print "LOGOUT NOW"
      r = self.get(API_ROOT+'/account/verify_auth')
      self.assertJsonStatusCode(r, 401)
      self.assertIn('"errors"', r.data)
   
   def test_signup(self):
      data = self.test_data
      
      r =  self.jpost(API_ROOT+'/auth/signup', data=data, follow_redirects=False)
      
      self.assertOkJson(r)
      self.assertIn('"success"', r.data)
   
   def test_signup_wrong_empty_fields(self):
      data = self.test_data
      data['user_name'] =''
      data['first_name'] = ''
      data['last_name'] = ''
      data['email'] = ''
            
      r =  self.jpost(API_ROOT+'/auth/signup', data=data, follow_redirects=False)
      self.assertJsonFormError(r)
   def test_signup_wrong_email(self):
      data = self.test_data
      data['email']= 'asdfasdfasdf'
            
      r =  self.jpost(API_ROOT+'/auth/signup', data=data, follow_redirects=False)
      self.assertJsonFormError(r)
      
   def test_signup_wrong_confirm(self):
      data = self.test_data
      data['password'] = 'test23'
      data['confirm']  = 'test'
            
      r =  self.jpost(API_ROOT+'/auth/signup', data=data, follow_redirects=False)
      self.assertJsonFormError(r)
      
   