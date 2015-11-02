from . import AppLoggedTestCase, API_ROOT


"""
Test Search API
"""
'''
class TestSearch(AppLoggedTestCase):
   def __init__(self, *args, **kwargs):
      super(TestSearch, self).__init__(*args, **kwargs)
      self.POSTS_ROOT = '/posts'
      self.SEARCH_ROOT = '/search'
      self.test_post = {
         'name': 'clothing',
         'hashtags': "clothing",
         'price': "10.0",
         'description': 'test'
      }

   def test_auth(self):
      r = self.get(API_ROOT+'/account/verify_auth')
      self.assertOkJson(r)

   def test_search_no_posts(self):
      r = self.get(API_ROOT+self.SEARCH_ROOT)
      d = self._jsonLoad(r)
      self.assertEqual(d['data']['total'], 0)      
   
   def test_search_all_posts(self):
      self.add_posts()
      r = self.get(API_ROOT+self.SEARCH_ROOT+"?circle=ucla")
      d = self._jsonLoad(r)
      self.assertEqual(d['data']['total'], 3)  

   
   def test_search_hashtag(self):
      self.add_posts()
      r = self.get(API_ROOT+self.SEARCH_ROOT+"?hashtag=clothing&circle=ucla")
      d = self._jsonLoad(r)
      self.assertEqual(d['data']['total'], 3) 
   
   def test_search_category_none(self):
      self.add_posts()
      r = self.get(API_ROOT+self.SEARCH_ROOT+"?hashtag=electronics&circle=ucla")
      d = self._jsonLoad(r)
      self.assertEqual(d['data']['total'], 0) 
      
   def test_search_user(self):
      self.add_posts()
      r = self.get(API_ROOT+self.SEARCH_ROOT+"?u_id=1&circle=ucla")
      d = self._jsonLoad(r)
      self.assertEqual(d['data']['total'], 3) 
     
   def test_search_user_none(self):
      self.add_posts()
      r = self.get(API_ROOT+self.SEARCH_ROOT+"?u_id=2&circle=ucla")
      d = self._jsonLoad(r)
      self.assertEqual(d['data']['total'], 0) 
   
   def test_search_name(self):
      self.add_posts()
      r = self.get(API_ROOT+self.SEARCH_ROOT+"?name=clothing&circle=ucla")
      d = self._jsonLoad(r)
      self.assertEqual(d['data']['total'], 2)  

   def test_search_name_none(self):
      self.add_posts()
      r = self.get(API_ROOT+self.SEARCH_ROOT+"?name=test&circle=ucla")
      d = self._jsonLoad(r)
      self.assertEqual(d['data']['total'], 0)   
  
   def test_search_complex(self):
      self.add_posts()
      r = self.get(API_ROOT+self.SEARCH_ROOT+"?name=furniture&hashtag=furniture&u_id=1&circle=ucla")
      d = self._jsonLoad(r)
      self.assertEqual(d['data']['total'], 1) 

   
   #Helper function that adds posts in so that we can test 
   def add_posts(self):
      clothing_post = self.test_post
      self.jpost(API_ROOT+self.POSTS_ROOT, data=clothing_post, follow_redirects=False)
      self.jpost(API_ROOT+self.POSTS_ROOT, data=clothing_post, follow_redirects=False)
      
      furniture_post = self.test_post
      furniture_post['name'] = 'furniture'
      furniture_post['hashtags'] = "clothing, furniture"
      self.jpost(API_ROOT+self.POSTS_ROOT, data=furniture_post, follow_redirects=False)
'''
   