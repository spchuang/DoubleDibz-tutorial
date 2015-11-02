from flask import json
from celery import group
from celery.utils.log import get_task_logger
from ..extensions import db, celery
from .constants import POST, USER, SYSTEM, SUBSCRIBED, ACTION_TYPE, SUBSCRIBE_STATUS, CONTACT_SELLER, SYSTEM_NOTIFICATION
from .models import Notification, NotificationAction, UserPostSubscribe, UserFollowerSubscribe
from ..cache import notification_cache as cache

logger = get_task_logger(__name__)

@celery.task(name="update_object_notifications")
def update_object_notifications(object_id, object_type, actor_id, action_type):
   try:
      if object_type == POST:
         subscribers = UserPostSubscribe.by_post_id(object_id)
      elif object_type == USER:
         subscribers = UserFollowerSubscribe.by_user_id(object_id)
      else:
         return "object type does not exist"
         
      task_list = []
      for user in subscribers:
         #Only add notification if subscriber did not commit the action and subscribe status is active
         if user.subscriber_id != actor_id and user.status_code == SUBSCRIBED:
            logger.info("Add notification to subscriber {0} for actor {1}!".format(user.subscriber_id, actor_id))
            data = {
               'user_id': user.subscriber_id,
               'actor_id': actor_id,
               'object_id': object_id,
               'object_type_code': object_type,
               'action_type_code': action_type
            }
            task_list.append(update_notification.si(data))
      tasks = group(task_list)
      tasks()
   except Exception as e:
      db.session.rollback()
      logger.info("Exception : %s " % str(e))
      
'''Send system notification'''   
@celery.task(name="send_system_notification")
def send_system_notification(user_id, object_id):
   try:
      #create notification action   
      notification = Notification(
            user_id = user_id,
            actor_id = None,
            object_id = object_id,
            object_type_code = SYSTEM,
            action_type_code = SYSTEM_NOTIFICATION
         )
      db.session.add(notification)  
      db.session.commit()
      cache.incr_notication_count(user_id)
   except Exception as e:
      db.session.rollback()
      logger.info("Exception : %s" % str(e))

@celery.task(name="update_notification")
def update_notification(data):
   #Update notifications where COUNT does't matter. 
   try:
      notification = Notification.by_user_object_action(data['user_id'], data['object_id'], data['object_type_code'], data['action_type_code'])
      logger.info("notification {}".format(notification))
      #Only updates time and actor when SAME notification is hit.
      if notification:
         notification.update_actor_id(int(data['actor_id']))
         notification.updateTime() 
         #only incr count if new or unread(from aggregation) notification
         if notification.is_read():
            cache.incr_notication_count(data['user_id'])
            notification.set_unread()
            logger.info("Incremented cache count for user {0}".format(data['user_id']))
      else:      
         #create notification
         notification = Notification(
            user_id = int(data['user_id']),
            actor_id = int(data['actor_id']),
            object_id = int(data['object_id']),
            object_type_code = int(data['object_type_code']),
            action_type_code = int(data['action_type_code'])
         )
         db.session.add(notification)
         cache.incr_notication_count(data['user_id'])
      
      #create notification action   
      action = NotificationAction(actor_id = data['actor_id'], action_type_code = data['action_type_code'])
      db.session.add(action)
      db.session.commit()
      
      logger.info("Added user {0} notification for {1}!".format(data['user_id'], ACTION_TYPE[data['action_type_code']]))
   except Exception as e:
      db.session.rollback()
      logger.info("Exception : %s" % str(e))

@celery.task(name="contact_seller")
def contact_seller(buyer_id, seller_id, post_id):
   try:
      #Updates time, actor, and count when SAME notification is hit.
      notification = Notification.by_user_object_action(seller_id, post_id, POST, CONTACT_SELLER)
      if notification:
         notification.update_actor_id(buyer_id)
         notification.increment_count()  
         notification.updateTime()  
         #only incr count if new or unread(from aggregation) notification
         if notification.is_read():
            cache.incr_notication_count(data['user_id'])
            notification.set_unread()
            logger.info("Incremented cache count for user {0}".format(data['user_id']))  
      else:
         #create notification
         notification = Notification(
            user_id = seller_id,
            actor_id = buyer_id,
            object_id = post_id,
            object_type_code = POST,
            action_type_code = CONTACT_SELLER
         )
         db.session.add(notification)  
         cache.incr_notication_count(data['user_id'])
      
      #create notification action   
      action = NotificationAction(actor_id=buyer_id, action_type_code=CONTACT_SELLER)
      db.session.add(action)
      db.session.commit()
      
      logger.info("Added user {0} notification for {1}!".format(seller_id, ACTION_TYPE[CONTACT_SELLER]))
   except Exception as e:
      db.session.rollback()
      logger.info("Exception : %s" % str(e))

'''This task subscribes/unsubscribes all users to a particular object'''   
@celery.task(name="change_subscriptions")
def change_subscriptions(object_id, object_type, status_code):
   try:
      if object_type == POST:
         subscribers = UserPostSubscribe.by_post_id(object_id)
      elif object_type == USER:
         subscribers = UserFollowerSubscribe.by_user_id(object_id)
      else:
         return "object type does not exist"
            
      #Change subscription statuses
      for user in subscribers:
         user.status_code = status_code
         logger.info("Changed user {0} subscription status to {1}".format(user.subscriber_id, SUBSCRIBE_STATUS[status_code]))
      db.session.commit()
   except Exception as e:
      db.session.rollback()
      logger.info("Exception : %s" % str(e))
      
