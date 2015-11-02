from . import AppLoggedTestCase, AppTestCase, API_ROOT
from app.extensions import db
from app.users import User,UserSettings,  ADMIN, USER,ACTIVE, INACTIVE,MALE, FEMALE, USER_STATUS, USER_ROLE
from app.emails import Email, VERIFIED
from sqlalchemy import exc


class TestUserModel(AppTestCase):
   def __init__(self, *args, **kwargs):
      super(TestUserModel, self).__init__(*args, **kwargs)
      self.correct_password = u'123456'
      self.good_guy = User(
            first_name=u'good',
            last_name=u'guy',
            user_name=u'test',
            password= self.correct_password,
            role_code=USER,
            status_code=ACTIVE,
            user_settings=UserSettings(
                sex_code=MALE))
      self.good_girl = User(
            first_name=u'good',
            last_name='girl',
            user_name=u'crazy_girl',
            password=self.correct_password,
            role_code=USER,
            status_code=INACTIVE,
            user_settings=UserSettings(
                sex_code=FEMALE))
      self.good_girl_email = Email(address= "girl@example.com", is_primary=False, status_code=VERIFIED) 
      
   def test_add_with_empty_user_name(self):
      user = self.good_guy
      user.user_name = None
      db.session.add(user)
      self.assertRaises(exc.IntegrityError, db.session.commit)
      
   def test_add_with_empty_first_name(self):
      user = self.good_guy
      user.first_name = None
      db.session.add(user)
      self.assertRaises(exc.IntegrityError, db.session.commit)
      
   def test_add_with_empty_last_name(self):
      user = self.good_guy
      user.last_name = None
      db.session.add(user)
      self.assertRaises(exc.IntegrityError, db.session.commit)
   
   def test_add_with_duplicate_user_name(self):
      guy = self.good_guy
      girl = self.good_girl
      girl.user_name = guy.user_name
      db.session.add(guy)
      db.session.add(girl)
      self.assertRaises(exc.IntegrityError, db.session.commit)
      
   def test_check_password(self):
      guy = self.good_guy
      db.session.add(guy)
      db.session.commit()
      self.assertTrue(guy.check_password(self.correct_password))
      self.assertFalse(guy.check_password('1234123142'))
      
   def test_is_user_name_taken(self):
      guy = self.good_guy
      db.session.add(guy)
      db.session.commit()
      self.assertTrue(User.is_user_name_taken(guy.user_name))
      self.assertFalse(User.is_user_name_taken(self.good_girl.user_name))
      
   def test_authenticate(self):
      guy = self.good_guy
      db.session.add(guy)
      db.session.commit()
      user,authenticated = User.authenticate(guy.user_name, self.correct_password)
      self.assertEqual(guy, user)
      self.assertTrue(authenticated)
      
      user,authenticated = User.authenticate(guy.user_name, 'asdfasd')
      self.assertEqual(guy, user)
      self.assertFalse(authenticated)
      
      user,authenticated = User.authenticate('random', 'asdfasd')
      self.assertIsNone(user)
      self.assertFalse(authenticated)
      
   def test_is_admin(self):
      self.assertTrue(self.demo_user.is_admin())
      guy = self.good_guy
      db.session.add(guy)
      db.session.commit()
      self.assertFalse(guy.is_admin())
      
   def test_user_role(self):
      guy = self.good_guy
      db.session.add(guy)
      db.session.commit()
      self.assertEqual(guy.role, USER_ROLE[guy.role_code])
   
   def test_user_status(self):
      guy = self.good_guy
      db.session.add(guy)
      db.session.commit()
      self.assertEqual(guy.status, USER_STATUS[guy.status_code])
      
   def test_user_set_active(self):
      girl = self.good_girl
      db.session.add(girl)
      db.session.commit()
      self.assertEqual(girl.status, USER_STATUS[INACTIVE])
      girl.set_to_active()
      db.session.commit()
      self.assertEqual(girl.status, USER_STATUS[ACTIVE])
      
   def test_add_email(self):
      girl = self.good_girl
      db.session.add(girl)
      db.session.commit()
      
      self.assertEqual(len(girl.emails.all()), 0)
      email = self.good_girl_email
      girl.add_email(email)
      db.session.add(email)
      db.session.commit()
      self.assertEqual(len(girl.emails.all()), 1)
      self.assertEqual(girl.emails.all()[0].address, self.good_girl_email.address)

      
   