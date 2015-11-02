from . import AppLoggedTestCase, API_ROOT

"""
Test Posts Comments API
"""

class TestPostComments(AppLoggedTestCase):
   def __init__(self, *args, **kwargs):
      super(TestPostComments, self).__init__(*args, **kwargs)
      self.POSTS_ROOT = '/posts'
      self.test_post = {
         'name': 'test',
         'hashtags': "clothing",
         'price': "10.0",
         'description': 'test'
      }
      self.test_comment = {
         'comment': 'test'
      }
      
   def test_auth(self):
      r = self.get(API_ROOT+'/account/verify_auth')
      self.assertOkJson(r)
      
   def test_add_comment_good(self):
      #add post
      data = self.test_post
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      
      #add comment
      data = self.test_comment
      r = self.jpost(API_ROOT+self.POSTS_ROOT+'/1/comments', data=data, follow_redirects=False)
      self.assertJsonWithData(r, data)
      
   
   def test_add_comment_no_post(self):
      data = self.test_comment
      r = self.jpost(API_ROOT+self.POSTS_ROOT+'/1/comments', data=data, follow_redirects=False)
      self.assertJsonError(r, 404, "Not Found")     
      
   def test_add_empty_comment(self):
      data = self.test_post
      r = self.jpost(API_ROOT+self.POSTS_ROOT, data=data, follow_redirects=False)
      
      data = {
         'comment':''
      }
      r = self.jpost(API_ROOT+self.POSTS_ROOT+'/1/comments', data=data, follow_redirects=False)
      self.assertJsonError(r, 422, "Form validation error")  
      