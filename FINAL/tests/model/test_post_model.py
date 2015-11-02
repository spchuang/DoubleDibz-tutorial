from . import AppLoggedTestCase, AppTestCase, API_ROOT
from app.extensions import db
from app.posts import Post
from app.hashtags import Hashtag
from sqlalchemy import exc


class TestPostModel(AppTestCase):
   def __init__(self, *args, **kwargs):
      super(TestPostModel, self).__init__(*args, **kwargs)
      self.good_post = Post(
            name=u'Math textbook',
            price=u'40.56',
            description=u'math 33A class')
      
      self.good_hashtag = Hashtag(name=u'testing')
   
   def test_add_with_empty_name(self):
      post = self.good_post
      post.name = None
      db.session.add(post)
      self.assertRaises(exc.IntegrityError, db.session.commit)
      
   def test_add_with_empty_price(self):
      post = self.good_post
      post.price = None
      db.session.add(post)
      self.assertRaises(exc.IntegrityError, db.session.commit)
      
   def test_add_hashtag(self):
      post = self.good_post
      db.session.add(post)
      db.session.commit()
      self.assertEqual(len(post.hashtags), 0)
      
      hashtag = self.good_hashtag
      post.add_hashtag(hashtag)
      db.session.add(hashtag)
      db.session.commit()
      self.assertEqual(len(post.hashtags), 1)
      self.assertEqual(post.hashtags[0].name, self.good_hashtag.name)
      
   def test_remove_hashtag(self):
      post = self.good_post
      hashtag = self.good_hashtag
      post.add_hashtag(hashtag)
      db.session.add(post)
      db.session.add(hashtag)
      db.session.commit() 
      
      post.remove_hashtag(hashtag)
      db.session.commit()
      self.assertEqual(len(post.hashtags), 0)   
   
    