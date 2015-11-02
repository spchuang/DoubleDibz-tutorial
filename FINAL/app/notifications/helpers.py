from ..users import User
from ..posts.models import Post
from . import constants as NOTIF

'''
   Helper functions for notifications
'''
MESSAGES = {
   NOTIF.POST_EDIT            : "edited",
   NOTIF.POST_DELETE          : "deleted",    
   NOTIF.POST_STATUS_INACTIVE : "changed post status to sold for",   
   NOTIF.POST_STATUS_ACTIVE   : "changed post status to selling for",   
   NOTIF.POST_COMMENT         : "commented on",   
   NOTIF.CONTACT_SELLER       : "contacted you for", 
}

SYSTEM_NOTIFICATION = {
   0 : 'Welcome to DoubleDibz!'
}
      
def create_notification_message(action_type_code, count, actor_id, object_id):

   if action_type_code == NOTIF.SYSTEM_NOTIFICATION:
      return "System sent you a notification"

   base_message = MESSAGES[action_type_code]
 
   user = User.by_id(actor_id)
   post = Post.by_id(object_id)
   
   if not post:
      post_name = '[Deleted post]'
   else:
      post_name = post.name      

   if count < 2:
      return "{} {} {}".format(user.user_name, base_message, post_name)
   return "{} and {} others {} {}".format(user.user_name, count-1, base_message, post_name)
   
    
def create_post_notification_message(action_type_code, count, user_name, post_name, object_id):
   
   if action_type_code == NOTIF.SYSTEM_NOTIFICATION:
      if object_id in SYSTEM_NOTIFICATION:
         return SYSTEM_NOTIFICATION[object_id]
      return "System sent you a notification"
   
   base_message = MESSAGES[action_type_code]
   
   if count < 2:
      return "{} {} {}".format(user_name, base_message, post_name)
   return "{} and {} others {} {}".format(user_name, count-1, base_message, post_name)