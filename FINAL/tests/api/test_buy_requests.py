from . import AppLoggedTestCase, API_ROOT

"""
Test BuyRequests API
"""

class TestBuyRequests(AppLoggedTestCase):
   def __init__(self, *args, **kwargs):
      super(TestBuyRequests, self).__init__(*args, **kwargs)
      self.REQS_ROOT = '/buyrequests'
      self.test_request = {
         'name': 'textbook',
         'description': 'cs31'
      }
   
   '''   
   def test_get_requests(self):
      r = self.get(API_ROOT+self.REQS_ROOT)
      self.assertJsonLength(r, 0)
      
   def test_create_request(self):
      data = self.test_request
      r = self.jpost(API_ROOT+self.REQS_ROOT, data=data, follow_redirects=False)
      self.assertJsonWithData(r, data)
      
   def test_create_request_empty_name(self):
      data = self.test_request
      del data['name']
      r = self.jpost(API_ROOT+self.REQS_ROOT, data=data, follow_redirects=False)
      self.assertJsonFormError(r)
      
   def test_create_request_empty_desc(self):
      data = self.test_request
      del data['description']
      r = self.jpost(API_ROOT+self.REQS_ROOT, data=data, follow_redirects=False)
      self.assertJsonFormError(r)  
      
   def test_edit_request(self):
      data = self.test_request
      r = self.jpost(API_ROOT+self.REQS_ROOT, data=data, follow_redirects=False)
      self.assertJsonWithData(r, data)
      d = self._jsonLoad(r)
      id = d['data']['id']
      data = {
         'name': 'pants',
         'description': 'large'
      }
      r = self.jput(API_ROOT+self.REQS_ROOT+"/"+str(id), data=data, follow_redirects=False)
      self.assertJsonWithData(r, data)
  
   def test_edit_request_not_exist(self):
      data = self.test_request
      r = self.jput(API_ROOT+self.REQS_ROOT+'/1', data=data, follow_redirects=False)
      self.assertJsonError(r, 404, "Not Found") 
      
   def test_delete_request(self):
      data = self.test_request
      r = self.jpost(API_ROOT+self.REQS_ROOT, data=data, follow_redirects=False)
      self.assertJsonWithData(r, data)  
      d = self._jsonLoad(r)
      id = d['data']['id']
      r = self.jdelete(API_ROOT+self.REQS_ROOT+"/"+str(id), data=data, follow_redirects=False)
      self.assertOkJson(r)
      
   def test_delete_request_not_exist(self):
      r = self.delete(API_ROOT+self.REQS_ROOT+'/1')
      self.assertJsonError(r, 404, "Not Found")      

   '''    