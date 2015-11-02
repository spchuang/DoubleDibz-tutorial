from . import AppLoggedTestCase, API_ROOT

"""
Test BugPosts API
"""

class TestBugs(AppLoggedTestCase):
   def __init__(self, *args, **kwargs):
      super(TestBugs, self).__init__(*args, **kwargs)
      self.BUG_ROOT = '/bugposts'
      self.test_bug_post = {
         'name': 'test',
         'description': "test"
      }
      
   def test_auth(self):
      r = self.get(API_ROOT+'/account/verify_auth')
      self.assertOkJson(r)   
      
   def test_get_bugs_posts_none(self):
      r = self.get(API_ROOT+self.BUG_ROOT)
      self.assertOkJson(r)
      self.assertJsonLength(r, 0)
   
   def test_create_bug_post(self):
      data = self.test_bug_post
      r = self.jpost(API_ROOT+self.BUG_ROOT, data=data, follow_redirects=False)
      self.assertJsonWithData(r, data)
      