'''
   Goal: Send daily "Today's posts" notification to users on FB.

'''
from celery import group
from celery.utils.log import get_task_logger
from ..extensions import db, celery
from ..users import UserFacebookAccount
from ..post_comments import PostCommentTagging
from ..fb_helpers.graph import get_fb_graph_from_app

logger = get_task_logger(__name__)

TEMPLATES = {
   'msg': "Checkout the new listings for today!",
   'href': "?type=daily-listing"
}
NOTIFICATION_PATH = "%s/notifications"

@celery.task(name="send_daily_listing_to_user")
def send_daily_listing_to_user(to_id):
   try:
      graph = get_fb_graph_from_app()
      post_args = {
         'template': TEMPLATES['msg'],
         'href'    : TEMPLATES['href']
      }
      path = NOTIFICATION_PATH % to_id
      
      resp = graph.request(path=path, post_args=post_args) 
   except Exception as e:
      logger.info("Exception : %s " % str(e)) 

@celery.task(name="send_daily_listing_to_list")
def send_daily_listing_to_list(to_id_list):
   try:
      task_list = []
      for id in to_id_list:
         task_list.append(send_daily_listing_to_user.si(id))
      tasks = group(task_list)
      tasks()
   except Exception as e:
      logger.info("Exception : %s " % str(e)) 