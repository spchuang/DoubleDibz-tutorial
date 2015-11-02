from . import AppLoggedTestCase, AppTestCase, API_ROOT
from app.extensions import db
from app.emails import Email, EmailAuthAction, VERIFY_EMAIL, RESET_PASSWORD, ACTIVATE_USER, EMAIL_ACTION
from app.constants import STRING_LEN, EMAIL_LEN, YES, NO, BOOLEAN
from sqlalchemy import exc
from app.helpers import get_current_time_plus

class TestEmailAuthActionModel(AppTestCase):
   def __init__(self, *args, **kwargs):
      super(TestEmailAuthActionModel, self).__init__(*args, **kwargs)
      self.good_email = Email(address="goood@example.com", is_primary=False)
      self.same_email = Email(address="goood@example.com", is_primary=False)
      self.diff_email = Email(address="nope@example.com", is_primary=False)
      
   def test_create_ok(self):
      email = self.demo_user.primary_email
      new_action = EmailAuthAction(user=self.demo_user, action_code = VERIFY_EMAIL, email=email.address)
      db.session.add(new_action)
      db.session.commit()
      self.assertEqual(new_action.email_ref, email)
      self.assertFalse(new_action.isExpired())
      self.assertEqual(new_action.action, EMAIL_ACTION[new_action.action_code])
      self.assertEqual(new_action.action_code, VERIFY_EMAIL)
      self.assertEqual(new_action.email, email.address)
      
   def test_is_expired(self):
      email = self.demo_user.primary_email
      new_action = EmailAuthAction(user=self.demo_user, action_code = VERIFY_EMAIL, email=email.address)
      new_action.expire_at = get_current_time_plus(hours=0)
      db.session.add(new_action)
      db.session.commit()
      self.assertTrue(new_action.isExpired())
      
   def test_by_user(self):
      email = self.demo_user.primary_email
      user = self.demo_user
      new_action = EmailAuthAction(user=user, action_code = VERIFY_EMAIL, email=email.address)
      new_action2 = EmailAuthAction(user=user, action_code = VERIFY_EMAIL, email=self.good_email.address)
      db.session.add(new_action)
      db.session.add(new_action2)
      db.session.commit()
      self.assertEqual(EmailAuthAction.by_user(user), EmailAuthAction.query.filter_by(user_id=user.id).all())
      
   def test_by_email_and_user(self):
      email = self.demo_user.primary_email
      user = self.demo_user
      new_action = EmailAuthAction(user=user, action_code = VERIFY_EMAIL, email=email.address) 
      db.session.add(new_action)
      db.session.commit()
      check = EmailAuthAction.query.filter_by(user_id=user.id).filter_by(email=email.address).all()
      self.assertEqual(EmailAuthAction.by_email_and_user(email, user), check)
      
   def test_by_key_action_email(self):
      email = self.demo_user.primary_email
      user = self.demo_user
      new_action = EmailAuthAction(user=user, action_code = VERIFY_EMAIL, email=email.address)
      db.session.add(new_action)
      db.session.commit()
      
      key = new_action.activation_key
      action = new_action.action_code
      
      check = EmailAuthAction.query.filter_by(activation_key=key).filter_by(action_code=action).filter_by(email=email.address).first()
      self.assertEqual(EmailAuthAction.by_key_action_email(key,action,email.address), check)
      
   def test_delete_email_cascade_delete_email_action(self):
      email = self.demo_user.primary_email
      user = self.demo_user
      new_action = EmailAuthAction(user=user, action_code = VERIFY_EMAIL, email=email.address)
      new_action2 = EmailAuthAction(user=user, action_code = VERIFY_EMAIL, email=email.address)
      new_action3 = EmailAuthAction(user=user, action_code = VERIFY_EMAIL, email=email.address)
      db.session.add(new_action)
      db.session.add(new_action2)
      db.session.add(new_action3)
      db.session.commit()
      db.session
      self.assertEqual(len(EmailAuthAction.by_email_and_user(email, user)),3)
      db.session.delete(email)
      db.session.commit()
      self.assertEqual(len(EmailAuthAction.by_email_and_user(email, user)),0)
      