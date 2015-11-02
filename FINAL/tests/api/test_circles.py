from . import AppLoggedTestCase, API_ROOT

"""
Test Circles API
"""

class TestCircles(AppLoggedTestCase):
   def __init__(self, *args, **kwargs):
      super(TestCircles, self).__init__(*args, **kwargs)
      self.CIRCLES_ROOT = '/circles'