from flask import current_app
from .constants import MAX_IMG_PER_POST
from .models import Post




'''
   Helper functions for validating a string list of image ids with existing images 
'''

def get_new_and_del_images(id_str, tmp_images, post_images):
   '''
   Args:
      param1 (str): a string of image ids, delimited by comma (ex. "1,2,3,4")
      param2 (list): a list of all the temporary images (ones not linked to a post)
      param3 (list): a list of all the current images 
   Returns:
      error     : (obj or None):
      new_images: (array)  a list of image objects to add to post (and upload to s3)
      del_images: (array) a list of image objects to be removed
      
   Raises:
   
   '''
   #get a list of image ids
   images_id = get_images_id(id_str)
   
   #construct a list of all possible images for the post
   images_pool = tmp_images + post_images
   
   error = validate_images_id(images_id, images_pool)
   if error:
      return error, [], []
      
   new_images = _get_images_to_add(images_id, tmp_images)
   del_images = _get_images_to_del(images_id, post_images)
   return None, new_images, del_images
   

def get_images_id(images_str):
   '''
      Return a list of image ids based on a string delimited by commas
   '''
   images_id = [str(i.strip()) for i in str(images_str).split(',')]   
   return filter(None, images_id)


      
def validate_images_id(images_id, tmp_images):
   '''
      params1: a list of image ids to update/save
      params2: a list of of available image objects
      return error
   '''
   
   for i in images_id:
      try:
         int(i)
      except ValueError:
         return {'msg': "The image id list is corrupted"}
         
   
   if len(images_id) > MAX_IMG_PER_POST:
      return {'msg': "You have select more than %s images!" % MAX_IMG_PER_POST}
      
   tmp_images_id = [str(a.id) for a in tmp_images]
   
   #check if post_images are actually tmp_images
   for id in images_id:
      if id not in tmp_images_id:
         return {'msg': "An Image does not exist"}
         
   return None

   
def _get_images_to_add(images_id, tmp_images):
   '''
      return a list of images we need to add
      They are from the list of tmp/unassigned images that have been selected in images_id
   '''
   return [a for a in tmp_images if str(a.id) in images_id]

def _get_images_to_del(images_id, post_images):
   '''
      return a list of images we need to delete
      They are images currently linked to post but are not selected in images_id
   '''
   return [a for a in post_images if str(a.id) not in images_id]

