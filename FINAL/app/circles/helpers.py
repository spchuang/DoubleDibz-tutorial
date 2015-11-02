from flask import current_app
from .models import Circle
from ..extensions import db
from .. import response as Response
from ..users.models import UserCircleAuth
from .constants import FB_VERIFY_ID

# check if the user is part of the fb group by checking if he can see the post
# *Move this method here from fb_helpers due to circular import issues (FIX TODO?)                         
def is_fb_group_member(graph, group_name):
   if group_name == 'ucla':
      try:
         verify = graph.request("/" + FB_VERIFY_ID[group_name])
         if verify.get('id') != FB_VERIFY_ID[group_name]:
            return False
      except Exception as e:
         #FB API should throw an exception if cant see post
         return False
   return True
   
# if user is part of the fb college group, add his circle authentication
def add_user_to_college_if_member(graph, circle_name, user):
   if is_fb_group_member(graph, circle_name):
      college_circle = Circle.by_name(circle_name)
      if college_circle:
         new_auth = UserCircleAuth(user_id=user.id, circle_id=college_circle.id, source="facebook")
         join_circle(user, college_circle)
         db.session.add(new_auth)
         db.session.commit()

def join_circle(user, circle):
   ''' return false if user is already in the circle '''
   if not user.is_member(circle):
      circle.add_member(user)
      db.session.commit()
      return True
   return False

# NOTE: for now, user CANNOT leave a circle
def leave_circle(user, circle):
   if user.is_member(circle):
      #Maybe in the future also delete all of the users active posts in that circle?
      circle.remove_member(user)
      db.session.commit()
      return True
   return False