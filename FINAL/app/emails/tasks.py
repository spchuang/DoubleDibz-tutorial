from flask import current_app, render_template
from flask.ext.mail import Message
from celery.utils.log import get_task_logger
from ..extensions import mail, celery
from .constants import ACTIVATE_USER, RESET_PASSWORD, VERIFY_EMAIL, EMAIL_ACTION

logger = get_task_logger(__name__)

NAME = "DoubleDibz"

@celery.task(name="send_user_email")
def send_user_email(user_name, email, action_code, key):
   try:
      url =  'http://%s/session/verify?action=%s&key=%s&email=%s'%(current_app.config['DOMAIN_NAME'], action_code, key, email)
      
      #setup email contents
      if action_code == ACTIVATE_USER:
         subject = "[%s] Welcome to the Family" %NAME
         html_body = render_template('emails/activate_user.html', user_name=user_name, url=url, email=email)
      elif action_code == RESET_PASSWORD:
         subject = "[%s] Reset Password" %NAME
         html_body = render_template('emails/reset_password.html', user_name=user_name, url=url)  
      elif action_code == VERIFY_EMAIL:
         subject = "[%s] Verify your email '%s'" % (NAME, email)
         html_body = render_template('emails/verify_email.html', user_name=user_name, url=url, email=email)   
      else:
         return "email action type does not exist!"
      print subject
      #Send the email   
      if(current_app.config['USE_EMAIL']):
         msg = Message(subject, recipients = [email])
         if html_body:
            msg.html = html_body
         mail.send(msg)
         logger.info("Sent email:{} to {}".format(EMAIL_ACTION[action_code], email))
      else:
         logger.info("Turn use_email setting on to send emails!")
   except Exception as e:
      logger.info("Exception : %s" % str(e))

'''
@celery.task(name="send_email")
def send_email(subject, recipients, text_body=None, html_body=None):
   if(current_app.config['USE_EMAIL']):
      msg = Message(subject, recipients = recipients)
      if text_body:
         msg.body = text_body
      if html_body:
         msg.html = html_body
      mail.send(msg)
'''