from . import AppLoggedTestCase, API_ROOT


"""
Test Posts API
"""

class TestPosts(AppLoggedTestCase):
   def __init__(self, *args, **kwargs):
      super(TestPosts, self).__init__(*args, **kwargs)
      self.POSTS_ROOT = '/posts'
      self.test_post = {
         'name': 'test',
         'hashtags': "clothing",
         'price': "10.0",
         'description': 'test'
      }
   
   def test_auth(self):
      r = self.get(API_ROOT+'/account/verify_auth')
      self.assertOkJson(r)

   def test_get_posts(self):
      r = self.get(API_ROOT+self.POSTS_ROOT)
      self.assertJsonLength(r, 0)
   
   def test_create_post_one_tag(self):
      data = self.test_post
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      hashtags = data.pop("hashtags")
      self.assertJsonWithData(r, data)
      self.assertJsonHashtags(r, hashtags)  
       
   def test_create_post_multiple_tags(self): 
      data = self.test_post
      data['hashtags'] = "clothing, furniture, testing"
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      hashtags = data.pop("hashtags")
      self.assertJsonWithData(r, data)
      self.assertJsonHashtags(r, hashtags)  
   
   def test_create_post_no_category_tag(self):
      data = self.test_post
      data['hashtags'] = "testing"
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      hashtags = data.pop("hashtags")
      self.assertJsonFormError(r)   
      
   def test_create_post_wrong_empty_name(self):
      data = self.test_post
      del data['name']
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      self.assertJsonFormError(r)
   
   def test_get_single_post_wrong(self):
      r = self.get(API_ROOT+self.POSTS_ROOT+'/1')
      self.assertJsonError(r, 404, "Not Found")
      
   def test_get_single_post(self):
      data = self.test_post
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      d = self._jsonLoad(r)
      id = d['data']['id']
      r = self.get(API_ROOT+self.POSTS_ROOT+'/'+str(id))
      hashtags = data.pop("hashtags")
      self.assertJsonWithData(r, data) 
      self.assertJsonHashtags(r, hashtags) 
     
   def test_delete_post(self):
      data = self.test_post
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      d = self._jsonLoad(r)
      id = id = d['data']['id']
      r = self.delete(API_ROOT+self.POSTS_ROOT+'/'+str(id))
      self.assertOkJson(r)
   
   def test_delete_post_wrong(self):
      r = self.delete(API_ROOT+self.POSTS_ROOT+'/1')
      self.assertJsonError(r, 404, "Not Found")    
      
   def test_update_post(self):
      data = self.test_post
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      d = self._jsonLoad(r)
      id = d['data']['id']
      data = {
         'name': 'pants',
         'hashtags': "furniture",
         'price': "10.0",
         'description': 'large'
      }
      r = self.jput(API_ROOT+self.POSTS_ROOT+'/'+str(id), data=data, follow_redirects=False)
      hashtags = data.pop("hashtags")
      self.assertJsonWithData(r, data)
      self.assertJsonHashtags(r, hashtags) 
      
   def test_update_post_wrong(self):
      data = self.test_post
      r = self.jput(API_ROOT+self.POSTS_ROOT+'/1', data=data, follow_redirects=False)
      self.assertJsonError(r, 404, "Not Found")
      
   def test_update_post_bad_price(self):
      data = self.test_post
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      d = self._jsonLoad(r)
      id = d['data']['id'] 
      data['price'] = 'what'
      r = self.jput(API_ROOT+self.POSTS_ROOT+'/'+str(id), data=data, follow_redirects=False)
      self.assertJsonError(r, 422, "Form validation error")
      