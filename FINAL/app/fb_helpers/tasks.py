from celery import group
from celery.utils.log import get_task_logger
from ..extensions import db, celery
from ..users import UserFacebookAccount
from ..post_comments import PostCommentTagging
from .graph import get_fb_graph_from_app

logger = get_task_logger(__name__)

TEMPLATES = {
   'TAG_POST': "@[%s] has tagged you in '%s'",
   'selling':{
      'sender_has_fb': "@[%s] is interested in buying your '%s'",
      "sender_no_fb" : "%s is interested in buying your %s"
   },
   'buying': {
      'sender_has_fb': "@[%s] is interested in your request for '%s'",
      "sender_no_fb" : "%s is interested in your request for  %s"
   }
}

@celery.task(name="send_fb_notification")
def send_fb_notification(to_id, msg, href):
   graph = get_fb_graph_from_app()
   post_args = {
      'template': msg,
      'href'    : href
   }
   resp = graph.request(path=str(to_id)+"/notifications", post_args=post_args)  
   logger.info("Sent FB notification msg {}".format(msg))

@celery.task(name="send_tag_fb_notifications")
def send_tag_fb_notifications(from_user_id, tagged_ids, post):
   try:
      fb_user = UserFacebookAccount.by_user_id(from_user_id)
      if fb_user:
         msg = TEMPLATES['TAG_POST'] % (str(fb_user.fb_id), post.name)
         href = "?type={}&post_id={}".format("posts", post.id)
         fb_ids = tagged_ids.data.split(',')
         
         task_list = []
         for fb_id in fb_ids:
            tagged_fb_user = UserFacebookAccount.by_fb_id(fb_id)     
            #Only Tag user if they were not tagged before
            if tagged_fb_user and not PostCommentTagging.has_tagged(post.id, from_user_id, tagged_fb_user.user_id):
               tag = PostCommentTagging(post_id = post.id, user_id= from_user_id, tagged_user_id=tagged_fb_user.user_id)
               db.session.add(tag)
               db.session.commit()
               task_list.append(send_fb_notification.si(fb_id, msg, href))
         tasks = group(task_list)
         tasks()     
   except Exception as e:
      db.session.rollback()
      logger.info("Exception : %s" % str(e)) 

@celery.task(name="send_chat_fb_notification")      
def send_chat_fb_notification(from_user, post, chat):
   '''Send facebook notification to seller if they have a fbook account'''
   #check if sender has a fb account
   from_fb_user = UserFacebookAccount.by_user_id(from_user.id)
   
   if from_fb_user:
      msg = TEMPLATES[post.post_type]['sender_has_fb'] % (str(from_fb_user.fb_id), post.name)
   else:
      msg = TEMPLATES[post.post_type]['sender_no_fb'] % (from_user.user_name, post.name)
      
   #check if receiver has a fb account
   to_fb_user = UserFacebookAccount.by_user_id(post.user_id)
   if not to_fb_user:
      return 
      
   href = "?type={}&msg_type={}&post_id={}&chat_id={}".format("messages", "selling", post.id, chat.id)
   send_fb_notification.delay(to_fb_user.fb_id, msg, href)