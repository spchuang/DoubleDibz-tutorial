from . import AppLoggedTestCase, AppTestCase, API_ROOT
from app.extensions import db
from app.users import User,UserSettings,  ADMIN, USER,ACTIVE, INACTIVE,MALE, FEMALE, USER_STATUS, USER_ROLE
from app.emails import Email, VERIFIED, UNVERIFIED, EMAIL_STATUS
from app.constants import STRING_LEN, EMAIL_LEN, YES, NO, BOOLEAN
from sqlalchemy import exc

class TestEmailModel(AppTestCase):
   def __init__(self, *args, **kwargs):
      super(TestEmailModel, self).__init__(*args, **kwargs)
      self.good_email = Email(address="goood@example.com", is_primary=False)
      self.same_email = Email(address="goood@example.com", is_primary=False)
      self.diff_email = Email(address="nope@example.com", is_primary=False)
      
   def test_create_email_no_user(self):
      db.session.add(self.good_email)
      self.assertRaises(exc.IntegrityError, db.session.commit)

   def test_wrong_add_duplicate_emails(self):
      self.demo_user.add_email(self.good_email)
      self.demo_user.add_email(self.same_email)
      db.session.add(self.good_email)
      db.session.add(self.same_email)
      self.assertRaises(exc.IntegrityError, db.session.commit)
      
   def test_good_add_diff_emails(self):
      self.demo_user.add_email(self.good_email)
      self.demo_user.add_email(self.diff_email)
      db.session.add(self.good_email)
      db.session.add(self.diff_email)
      db.session.commit()
      self.assertEqual(len(self.demo_user.emails.all()), 3)
   
   def test_add_first_primary_email(self):
      db.session.delete(self.demo_user.primary_email)
      db.session.commit()
      self.assertIsNone(self.demo_user.primary_email)
      email = self.diff_email 
      email.set_to_primary(True)
      self.demo_user.add_email(email)  
      db.session.commit()
      self.assertEqual(email, self.demo_user.primary_email)
        
   def test_add_another_primary_email(self):
      email = self.diff_email 
      email.set_to_primary(True)
      with self.assertRaises(Exception):
         self.demo_user.add_email(email)  
         
   def test_set_to_primary(self): 
      email = self.good_email 
      self.assertFalse(email.is_it_primary())
      email.set_to_primary(True)
      self.assertTrue(email.is_it_primary())
      email.set_to_primary(False)
      self.assertFalse(email.is_it_primary())

   def test_set_to_verified(self):
      email = self.good_email 
      self.demo_user.add_email(email)
      db.session.add(email)
      db.session.commit()
      self.assertEqual(email.status_code, UNVERIFIED)
      email.set_to_verified(True)
      self.assertEqual(email.status_code, VERIFIED)
      email.set_to_verified(False)
      self.assertEqual(email.status_code, UNVERIFIED)
      
   def test_return_email_status(self):
      email = self.good_email 
      self.demo_user.add_email(email)
      db.session.add(email)
      db.session.commit()
      
      for e in self.demo_user.emails:
         self.assertEqual(e.status, EMAIL_STATUS[e.status_code])
         
   def test_is_email_taken(self):
      self.demo_user.add_email(self.good_email)
      db.session.commit()
   
      self.assertTrue(Email.is_email_taken(self.same_email.address))
      self.assertFalse(Email.is_email_taken(self.diff_email.address))
   
   def test_by_user_and_id(self):
      user = self.demo_user
      email_id = user.primary_email.id
      self.assertEqual(user.primary_email, Email.by_user_and_id(user, email_id))
      
   def test_by_id(self):
      user = self.demo_user
      email_id = user.primary_email.id
      self.assertEqual(user.primary_email, Email.by_id(email_id))
      
   def test_by_user(self):
      user = self.demo_user
      user.add_email(self.good_email)
      user.add_email(self.diff_email)
      db.session.add(self.good_email)
      db.session.add(self.diff_email)
      db.session.commit()
      self.assertEqual(user.emails.all(), Email.by_user(user))
      
   
   
       
      
