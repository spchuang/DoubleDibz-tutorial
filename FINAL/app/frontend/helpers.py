from flask.ext.login import current_user
from ..hashtags.constants import CATEGORIES
from ..circles import Circle
from ..users import UserCircleAuth

def get_bootstrap_data():
   authenticated = current_user.is_authenticated()

   #check if user is ucla verified
   ucla_circle = Circle.by_name("ucla")
   if authenticated and ucla_circle:
      if UserCircleAuth.by_user_circle_not_temp(current_user, ucla_circle):
         ucla_verified = True
      else:
         ucla_verified = False
   else:
      ucla_verified = False
      
   data = {
      'authenticated': authenticated,
      'categories' : [{'name': i} for i in CATEGORIES],
      'ucla_verified': ucla_verified
   }

   if authenticated:
      data['user'] = current_user.to_json()
      
   return data
   