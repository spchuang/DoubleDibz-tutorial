PROFILE_WH= 320
PROFILE_THUMB_WH = 40
import urllib2

FB_PICTURE_API = 'https://graph.facebook.com/%s/picture?height=%s&width=%s'

def get_fb_profile_image(uid):
   import time
   start = time.time()
   img = urllib2.urlopen(FB_PICTURE_API % (uid, PROFILE_WH, PROFILE_WH))
   end = time.time()
   print "TIMEEEE"
   print end-start
   start = end
   
   #note: we could resize it ourself
   img_thumb = urllib2.urlopen(FB_PICTURE_API % (uid, PROFILE_THUMB_WH, PROFILE_THUMB_WH))
   end = time.time()
   print "TIMEEEE"
   print end-start
   
   return img, img_thumb