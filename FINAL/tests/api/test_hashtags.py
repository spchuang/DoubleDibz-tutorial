from . import AppLoggedTestCase, API_ROOT

"""
Test Hashtags API
"""

class TestHashtags(AppLoggedTestCase):
   def __init__(self, *args, **kwargs):
      super(TestHashtags, self).__init__(*args, **kwargs)
      self.CAT_ROOT = '/categories'
      self.HASH_ROOT = '/hashtags'
      self.POSTS_ROOT = '/posts'
      self.test_post = {
         'name': 'test',
         'hashtags': "clothing, testing",
         'price': "10.0",
         'description': 'test'
      }
      
      
   def test_auth(self):
      r = self.get(API_ROOT+'/account/verify_auth')
      self.assertOkJson(r)   
      
   #categories are constant and there are 6   
   def test_get_categories(self):
      r = self.get(API_ROOT+self.CAT_ROOT)
      self.assertOkJson(r)
      self.assertJsonLength(r, 6)
      
   def test_get_hashtags(self):
      r = self.get(API_ROOT+self.HASH_ROOT)
      self.assertOkJson(r)
      self.assertJsonLength(r, 6)
      
   def test_add_hashtags(self):
      data = self.test_post
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      r = self.get(API_ROOT+self.HASH_ROOT)
      self.assertOkJson(r)
      self.assertJsonLength(r, 7)
      self.assertIn("testing", r.data)
   
   ''' #Possibly add this in later, so when no posts with given hashtag exists delete tag
   def test_delete_hashtags(self):
      data = self.test_post
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      d = self._jsonLoad(r)
      id = id = d['data']['id']
      r = self.delete(API_ROOT+self.POSTS_ROOT+'/'+str(id))
      r = self.get(API_ROOT+self.HASH_ROOT)
      self.assertJsonLength(r, 6)
   '''