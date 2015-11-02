from . import AppLoggedTestCase, API_ROOT
from app.emails import Email, VERIFIED, EMAIL_STATUS

"""
Test Account API
"""

class TestAccount(AppLoggedTestCase):
   def __init__(self, *args, **kwargs):
      super(TestAccount, self).__init__(*args, **kwargs)
      self.SETT_ROOT = '/account/settings'
      self.PASS_ROOT = '/account/password'
      self.EMAILS_ROOT = '/account/emails'
      self.test_good_settings = {
         'first_name': 'test',
         'last_name': 'test',
         'age': "3",
         'bio': "testing",
         'phone': "333-333-3333",
         'sex_code': 1
      }
      self.test_good_password = {
         'old_password': '123456', 
         'password': '555555', 
         'confirm': '555555' 
      }
   
   def test_auth(self):
      r = self.get(API_ROOT+'/account/verify_auth')
      self.assertOkJson(r)

   def test_get_settings(self):
      r = self.get(API_ROOT+self.SETT_ROOT)
      self.assertOkJson(r)
      self.assertIn('"user_name": "%s"'   % self.demo_user.user_name, r.data)
      self.assertIn('"first_name": "%s"'  % self.demo_user.first_name, r.data)
      self.assertIn('"last_name": "%s"' % self.demo_user.last_name, r.data)
      self.assertIn('"age": %s'     % self.demo_user.user_settings.age, r.data)
      self.assertIn('"bio": "%s"'   % self.demo_user.user_settings.bio, r.data)
      self.assertIn('"phone": "%s"' % self.demo_user.user_settings.phone, r.data)
      self.assertIn('"sex_code": %s' % self.demo_user.user_settings.sex_code, r.data)
      
   def test_update_settings(self):
      data = self.test_good_settings
      r = self.jput(API_ROOT+self.SETT_ROOT, data=data, follow_redirects=False)
      d = self._jsonLoad(r)
      self.assertEqual(d['data']['first_name'], data['first_name'])
      self.assertEqual(d['data']['last_name'], data['last_name'])
      self.assertEqual(d['data']['settings']['age'], int(data['age']))
      self.assertEqual(d['data']['settings']['bio'], data['bio'])
      self.assertEqual(d['data']['settings']['phone'], data['phone'])
      self.assertEqual(d['data']['settings']['sex_code'], data['sex_code'])
      self.assertIn('"success"', r.data)
         
   def test_update_settings_bad_age(self):
      data = self.test_good_settings
      data['age'] = "1000"
      r = self.jput(API_ROOT+self.SETT_ROOT, data=data, follow_redirects=False)
      self.assertJsonFormError(r)
      
   def test_update_settings_bad_phone(self):
      data = self.test_good_settings
      data['phone'] = "111-111-1111"
      r = self.jput(API_ROOT+self.SETT_ROOT, data=data, follow_redirects=False)
      self.assertJsonFormError(r)
      
   def test_update_settings_bad_sex(self):
      data = self.test_good_settings
      data['sex_code'] = 3
      r = self.jput(API_ROOT+self.SETT_ROOT, data=data, follow_redirects=False)
      self.assertJsonFormError(r)
      
   def test_change_password(self):
      data = self.test_good_password
      r = self.jput(API_ROOT+self.PASS_ROOT, data=data, follow_redirects=False)
      d = self._jsonLoad(r)
      self.assertIn('"success"', r.data)
      
   def test_change_password_wrong_confirm_password(self):
      data = self.test_good_password
      data['confirm'] = '556'
      r = self.jput(API_ROOT+self.PASS_ROOT, data=data, follow_redirects=False)
      self.assertJsonFormError(r)
      
   def test_change_password_wrong_current_password(self):
      data = self.test_good_password
      data['old_password'] = '123444'
      r = self.jput(API_ROOT+self.PASS_ROOT, data=data, follow_redirects=False)
      self.assertJsonError(r, 401, "Unauthorized")
      
   def test_get_emails(self):
      r = self.get(API_ROOT+self.EMAILS_ROOT)
      d = self._jsonLoad(r)
      self.assertEqual(d['data'][0]['address'], self.demo_user.primary_email.address)
      self.assertEqual(d['data'][0]['is_primary'], self.demo_user.primary_email.is_primary)
      self.assertEqual(d['data'][0]['status'], EMAIL_STATUS[self.demo_user.primary_email.is_primary])
      

   #problem right now is i dont want new email to be sent
   def test_create_email(self):
      pass
   
      
   