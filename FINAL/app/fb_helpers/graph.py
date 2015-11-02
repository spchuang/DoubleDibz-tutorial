from flask import current_app
import cStringIO
import urllib2
from uuid import uuid4
from PIL import Image as PIL_IMAGE
from facebook import get_user_from_cookie, GraphAPI

from ..helpers import get_current_time_plus
from ..extensions import db
from ..users.models import User, UserFacebookAccount
from ..users.constants import PROFILE_WH, PROFILE_THUMB_WH, PROFILE_NAME
from ..images.helpers import save_string_to_s3, add_thumb_ext, get_shrink_image, get_thumbnail


FB_PICTURE_API = 'https://graph.facebook.com/%s/picture?height=%s&width=%s'

def get_fb_profile_image(uid):
   img = urllib2.urlopen(FB_PICTURE_API % (uid, PROFILE_WH, PROFILE_WH))
   #note: we could resize it ourself
   img_thumb = urllib2.urlopen(FB_PICTURE_API % (uid, PROFILE_THUMB_WH, PROFILE_THUMB_WH))
   
   return img, img_thumb
   
def save_profile_image(user, img_data, img_thumb_data, ext = '.jpg'):
   img_name = user.user_name + "_" + PROFILE_NAME + str(uuid4()) + ext
   img_thumb_name = add_thumb_ext(img_name)
  
   save_string_to_s3(user.user_name, img_name, img_data)
   save_string_to_s3(user.user_name, img_thumb_name, img_thumb_data)
   
   #set the profile
   user.picture = img_name
   
def get_resize_profile_pic(data):
   #get a smaller version
   original = PIL_IMAGE.open(cStringIO.StringIO(data))
   shrunk = get_shrink_image(original, max_height = PROFILE_WH, step_two=False)
  
   #thumnail
   img       = get_thumbnail(shrunk, thumb_w=PROFILE_WH, thumb_h=PROFILE_WH)
   img_thumb = get_thumbnail(shrunk, thumb_w=PROFILE_THUMB_WH, thumb_h=PROFILE_THUMB_WH)
   
   #write imgages to string
   img_out       = cStringIO.StringIO()
   img_thumb_out = cStringIO.StringIO()
   
   img.save(img_out, original.format)
   img_thumb.save(img_thumb_out, original.format)
   
   img_data = img_out.getvalue()
   img_thumb_data = img_thumb_out.getvalue()

   img_out.close()
   img_thumb_out.close()
   
   return img_data, img_thumb_data

def get_fb_user_from_cookie(cookies, validate_taken=False):
   '''
      Validate fb user from cookie. Check if it's valid or if the user is already taken. Return graph object
   '''

   fb_user = get_user_from_cookie(cookies=cookies, app_id=current_app.config['FACEBOOK_APP_ID'],
                               app_secret=current_app.config['FACEBOOK_APP_SECRET'])
   if not fb_user:
      return None, {'code':422, 'msg': 'This Facebook account failed to authenticate'} 

   if validate_taken and UserFacebookAccount.is_fb_id_taken(fb_user['uid']):
      return None, {'code':409, 'msg': 'This Facebook account has already been registered!'}

   return fb_user, None

def authenticate_user_from_cookie(cookies):
   fb_user, error = get_fb_user_from_cookie(cookies)
   
   if error:
      return None, error
   
   user = User.authenticate_fb(fb_user['uid'])
   
   if not user:
      return None, {'code': 422, 'msg': "No user is connected with this Facebook account", 'type': "Wrong Authentication"}
   
   # update the user's token
   graph = get_fb_graph_from_user(fb_user)
   long_token = get_long_token(graph)
   
   fb_account = UserFacebookAccount.by_user_id(user.id)
   fb_account.access_token = long_token['access_token']
   fb_account.expires_at = get_current_time_plus(seconds=int(long_token['expires']))
   db.session.add(fb_account)
   db.session.commit()
      
   return user, None

def authenticate_user_from_fid(fid):
   user = User.authenticate_fb(fid)
   if not user:
      return None, {'code': 422, 'msg': "No user is connected with this Facebook account", 'type': "Wrong Authentication"}
      
   return user, None
   
def get_fb_graph_from_user(fb_user):
   return GraphAPI(fb_user["access_token"])

def get_fb_graph_from_app():
   return GraphAPI(current_app.config['FACEBOOK_APP_TOKEN'])
   
def get_long_token(graph):
   return graph.extend_access_token(app_id=current_app.config['FACEBOOK_APP_ID'], app_secret=current_app.config['FACEBOOK_APP_SECRET'])
                         


'''  
def is_fb_group_member(graph, group_id):
   groups = graph.request("me/groups", {'fields': 'parent'})['data']
   
   for group in groups:
      if 'parent' in group.keys() and int(group['parent']['id']) == group_id:
         return True
   return False
'''