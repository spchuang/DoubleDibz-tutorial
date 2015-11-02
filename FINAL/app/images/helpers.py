from .constants import THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, MAX_IMG_HEIGHT, THUMBNAIL_EXTENSION
from flask import current_app
from ..helpers import get_current_time, get_current_time_plus
from PIL import Image as PIL_IMAGE
import cStringIO
import os
import hashlib
import boto
from boto.s3.connection import S3Connection
from boto.s3.key import Key
import time


'''
   Helper functions for dealing with files on disk

'''
def delete_image(image):
   '''
      Depending on the state of the image, either delete it locally or delete it from s3
   '''
   if image.on_s3():
      delete_image_from_s3(image)
   else:
      delete_image_on_disk(image)
      

def delete_image_on_disk(image):
   file_abs_path = get_abs_path(image.file_name)
   thumb_abs_path = add_thumb_ext(file_abs_path)
   
   _delete_file(file_abs_path)
   _delete_file(thumb_abs_path)
      
def _delete_file(file):
   if os.path.isfile(file):
      os.remove(file)
 

'''
   Helper functions for s3 specific operations

'''
def save_string_to_s3(user_name, key, string_data):
   bucket = _get_bucket()
  
   #include user path as prefix
   store_key = user_name+'/'+key
   
   #assuming the key is unique (it should be)
   k = bucket.new_key(store_key)

   k.set_contents_from_string(string_data, \
       policy='public-read',\
       headers={\
         'Cache-Control': "max-age=31536000, public",\
         'Expires'      : get_current_time_plus(days=365).strftime("%a, %d %b %Y %H:%M:%S GMT")})


def save_images_to_s3(user, images):
   '''
      Save an array of images to s3 and delete the local copies from disk
   '''
   for i in images: 
      #image
      file_abs_path = get_abs_path(i.file_name)
      save_file_to_s3(user.user_name, i.file_name, file_abs_path)
      
      #image thumbnail
      thumb_name     = add_thumb_ext(i.file_name)
      thumb_abs_path = add_thumb_ext(file_abs_path)
      save_file_to_s3(user.user_name, thumb_name, thumb_abs_path)
            
      #delete the images
      delete_image_on_disk(i)

      
def delete_image_from_s3(image):
   #generate username
   user_name = get_user_name_from_file_name(image.file_name)
   file_key  = user_name+'/'+ image.file_name 
   thumb_key = add_thumb_ext(file_key)
   
   delete_file_from_s3(file_key)
   delete_file_from_s3(thumb_key)

def save_file_to_s3(user_name, key, file_abs_path):
   bucket = _get_bucket()
  
   #include user path as prefix
   store_key = user_name+'/'+key
   
   #assuming the key is unique (it should be)
   k = bucket.new_key(store_key)

   k.set_contents_from_filename(file_abs_path, \
       policy='public-read',\
       headers={\
         'Cache-Control': "max-age=31536000, public",\
         'Expires'      : get_current_time_plus(days=365).strftime("%a, %d %b %Y %H:%M:%S GMT")})
   

def delete_file_from_s3(key):
   bucket = _get_bucket()
   k = bucket.get_key(key)
   if k:
      k.delete()
   
def _get_bucket():
   conn = S3Connection(host = current_app.config['S3_REGION_ENDPOINT'])
   #the bucket should exists (notice we skip the request to check)
   bucket = conn.get_bucket(current_app.config['S3_BUCKET'], validate=False)
   return bucket

'''
   Helper function for creating image names, links, and file path

'''

def add_thumb_ext(file_name):
   '''
      Returns both the image abs path and the thumb abs path
   '''
   root, ext = os.path.splitext(file_name)
   thumb = root+THUMBNAIL_EXTENSION+ext

   return thumb

def get_user_name_from_file_name(file_name):
   #By convention, image name is [user_name]_[hash]_[day].[ext]
   return file_name.split("_")[0] 
   
def get_hash_name(file_data, file_name, user_name):
    #construct the file name
   today = get_current_time().strftime('_%Y%m%d%H%M%S')
   root, ext = os.path.splitext(file_name)
   hash_name = user_name + "_" + hashlib.sha1(file_data).hexdigest() + today + ext
   return hash_name
   
def get_abs_path(file_name):
   #upload directory (currently, /tmp/instance/upload)
   upload_dir = current_app.config['UPLOAD_FOLDER']
   return os.path.join(upload_dir, file_name)
   
def get_s3_link(file_name):
   
   user_name = get_user_name_from_file_name(file_name)
   #prefix = [bucket_name].[region_endpoint]/[user_name]/ -> + [file_name]
   return 'https://'+current_app.config['S3_BUCKET']+'.'+current_app.config['S3_REGION_ENDPOINT'] +\
      '/'+user_name +'/' + file_name
   
'''
   Helper functions for images resizing/cropping, assume thumbnail smaller than image
''' 

def save_shrink_and_thumbnail(data, file_name):
   shrink_image_path = get_abs_path(file_name)
   thumb_image_path = add_thumb_ext(shrink_image_path)
   string_io = cStringIO.StringIO(data)
   
   original = PIL_IMAGE.open(string_io)
   
   #shrink the image
   shrunk = get_shrink_image(original)
   shrunk.save(shrink_image_path)

   #crop and create thumbnail
   thumb = get_thumbnail(shrunk)
   thumb.save(thumb_image_path) 
   
   string_io.close()

def get_thumbnail(image, thumb_w = THUMBNAIL_WIDTH, thumb_h = THUMBNAIL_HEIGHT):
   '''
      Crop the image to the maximum possible thumbnail ratio in the center, then resize to thumbnail size
   '''
   #Find largest thumbnail ratio that fits in original
   width,height = image.size
   
   wratio = width / float(thumb_w)
   hratio = height/ float(thumb_h)
   if hratio <= wratio:
        multiplier = hratio
   else:
        multiplier = wratio
           
   #Crop the original image based on the ratio
   dx = (width - thumb_w * multiplier)/2
   dy = (height- thumb_h * multiplier)/2
   left = dx
   top = dy
   right = width-dx
   bottom = height-dy
   print left, top, right, bottom
   
   thumb = image.crop((int(left), int(top), int(right), int(bottom)))
   
   thumb.thumbnail((thumb_w, thumb_h), PIL_IMAGE.ANTIALIAS)   
   return  thumb


def get_shrink_image(original, max_height=MAX_IMG_HEIGHT, step_two = True):
   '''
      Perform 2 step shrinking. First step with super low quality(fast) alg then with high quality alg
   '''
   width, height = original.size
   ratio = (1.0*width)/height
   new_height = max_height
   new_width = int(ratio * new_height)
   
   #Only shrink if height is over MAX
   if height > max_height:
      #step 1. shrink image to double of target size with fast algorithm
      original = original.resize((new_width*2, new_height*2))
   
   if step_two:
      #step 2. final shrink with slow (but high quality) algorithm
      return original.resize((new_width, new_height), PIL_IMAGE.ANTIALIAS)
   return original
