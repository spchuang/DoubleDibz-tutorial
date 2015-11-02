from ..helpers import JsonSerializer, get_current_time,dump_datetime
from ..extensions import db
from . import constants as POST

from ..constants import STRING_LEN
from ..hashtags.models import Hashtag


class PostJsonSerializer(JsonSerializer):
   __json_public__ = ['id', 'name', 'price', 'description']
   __json_modifiers__ = {
      'status_code' : ['status', (lambda code : POST.POST_STATUS[code])],
      'type_code'   : ['type', (lambda code : POST.POST_TYPE[code])],
      'created_at'  : ['created_at', (lambda date: dump_datetime(date))],
      'modified_at' : ['modified_at', (lambda date: dump_datetime(date))]
      }

class Post(db.Model, PostJsonSerializer):
   __tablename__ = "post"
   def __repr__(self):
      return '<Post %r>' % (self.id)
      
   id            = db.Column(db.Integer, primary_key = True)
   name          = db.Column(db.String(POST.POST_NAME_LEN), nullable = False)
   price         = db.Column(db.Numeric(precision=10,scale=2))
   description   = db.Column(db.String(POST.POST_BODY_LEN), nullable = False)
   created_at    = db.Column(db.DateTime, nullable=False, default = get_current_time)
   modified_at   = db.Column(db.DateTime, nullable=False, default = get_current_time, onupdate=get_current_time)
   user_id       = db.Column(db.Integer, db.ForeignKey("user.id"))
  
   # ================================================================
   # Post status
   
   status_code = db.Column(db.SmallInteger, default=POST.ACTIVE)
   
   @property
   def status(self):
      return POST.POST_STATUS[self.status_code]
   
   # ================================================================
   # Post type

   type_code = db.Column(db.SmallInteger, default=POST.SELLING)
   
   @property
   def post_type(self):
      return POST.POST_TYPE[self.type_code]

   __mapper_args__ = {
      'polymorphic_on': type_code,
      'polymorphic_identity': 'post'
   }
   
   # ================================================================
   # Relationships
   
   hashtags = db.relationship("Hashtag", 
      secondary="post_hashtag_rel", 
      primaryjoin = "post_hashtag_rel.c.post_id == Post.id",
      secondaryjoin = "post_hashtag_rel.c.hashtag_id == Hashtag.id",
      backref = db.backref('joined_posts', lazy = 'dynamic'),
      lazy = 'joined')  
      

   user   = db.relationship('User', uselist=False)   
   chats    = db.relationship('Chat', uselist=True, backref=db.backref('post', lazy='joined'), lazy='dynamic')
   comments = db.relationship('PostComment', uselist=True, backref="post", cascade="all,delete", lazy='dynamic') 
   taggedUsers = db.relationship('PostCommentTagging', uselist=True, cascade="all,delete", lazy="dynamic") 
   subscribers = db.relationship('UserPostSubscribe', uselist=True, backref="post", cascade="all,delete", lazy='dynamic')
   
   # ================================================================ 
   # Methods   
   def add_hashtag(self, hashtag):
      self.hashtags.append(hashtag)
      
   def remove_hashtag(self, hashtag):
      self.hashtags.remove(hashtag)
      
   def add_hashtags_from_list(self, hashtags):
      for h_name in hashtags:
         hashtag = Hashtag.by_name(name = h_name)
         #if hashtag doesn't exist, create it
         if not hashtag:
             hashtag = Hashtag(name = h_name) 
         self.add_hashtag(hashtag)
   
   def update_hashtags_from_list(self, hashtags):
      
      #remove the hashtags that arent here anymore
      for h in self.hashtags:
         if h.name in hashtags:
            #check if post already has the hashtag
            hashtags.remove(h.name)
         else:
            #should delete the hashtag
            self.remove_hashtag(h)
            
      self.add_hashtags_from_list(hashtags)

   def has_chat_with_user(self, user):
      #using raw query here to remove dependency on Chat
      q = "SELECT count(id) FROM chat WHERE post_id = :post_id AND contact_id = :contact_id"
      
      result = db.session.execute(q, {'post_id': self.id, 'contact_id': user.id}).first()
      #returns (0L,) or (1L,)
      return result[0]!=0
   

   def add_chat(self, chat):
      chat.owner_id       = self.user_id
      chat.owner_name     = self.user.user_name
      chat.static_post_id = self.id
      self.chats.append(chat)
   
   def add_comment(self, comment):
      self.comments.append(comment)
   
   #NOTE: remove get_hashtag param soon
   def to_json(self, user, get_hashtags=True, get_chat=True, get_bookmarks=False):
      '''
         if the post doesn't belong to the user, don't include user info. Return chat info for the post based on authenticated user
         
         Potential cache optimization:
            - Entire post json in cache (without chat)
            - chats for each post
            
      '''
      data = super(Post, self).to_json()
      data['user']   = self.user.to_basic_json()
      data['hashtags'] = [i.to_json() for i in self.hashtags]
      data['joined_circles'] = {
         'id': self.joined_circles[0].id,
         'name': self.joined_circles[0].name
      }
      data['src'] = 'us' 

      if user and not user.is_anonymous():
         #check if buyer has contacted
         if get_chat and not data['user']['user_name'] == user.user_name:
            chat = self.chats.filter_by(contact_id=user.id).first()
            data['has_contacted'] = True if chat else False
      
      if get_bookmarks and user and not user.is_anonymous():
         bookmarks = PostBookmark.by_all(self.id, user.id, POST.SOURCE_US)
         if bookmarks:
            data['is_bookmarked'] = True
         else:
            data['is_bookmarked'] = False
      
      '''
      if get_subscribe:
         subscriber = self.subscribers.filter_by(subscriber_id=user.id).first()
         if subscriber and subscriber.status_code == 1:
            data['has_subscribed'] = True
         else:
            data['has_subscribed'] = False
      '''
           
      return data

   
   # ================================================================ 
   # Class methods
   @classmethod
   def by_id(cls, id):
      return cls.query.options(db.joinedload('hashtags')).filter(Post.id==id).first()
      
   @classmethod
   def by_user_and_id(cls, user, id):
      return cls.query.filter(Post.id ==id).filter(Post.user_id == user.id).first()
      
   @classmethod
   def exists_by_id(cls, id):
      return db.session.query(db.exists().where(Post.id==id)).scalar()

   @classmethod
   def by_ids(cls, ids):
      return cls.query.filter(Post.id.in_( ids )).all()

class SellingPost(Post):
   __mapper_args__ = {
      'polymorphic_identity': POST.SELLING
   }

   # ================================================================
   # Relationships
   images   = db.relationship('Image', uselist=True, primaryjoin ="Post.id == Image.post_id", \
               cascade="all,delete", lazy='joined')   

   # ================================================================ 
   # Methods   
   def add_image(self, image):
      self.images.append(image)
      
   def add_images(self, post_images):
      for image in post_images:
         self.add_image(image)
         
   def set_primary_image(self, id):
      # we should probably check if id is valid
      for i in self.images:
         if i.id == id:
            i.set_primary(True)
         else:
            i.set_primary(False)
      
         
   def to_json(self, user, get_hashtags=True, get_chat=True, get_bookmarks=False):
      data = super(SellingPost, self).to_json(user, get_hashtags, get_chat, get_bookmarks)
      data['images'] = [i.to_json() for i in self.images] 
      return data


class BuyRequest(Post):
   __mapper_args__ = {
      'polymorphic_identity': POST.BUYING
   }
   
   # ================================================================ 
   # Methods   
   def to_json(self, user, get_hashtags=True, get_chat=True, get_bookmarks=False):
      data = super(BuyRequest, self).to_json(user, get_hashtags, get_chat, get_bookmarks)
      return data


class PostBookmark(db.Model):
   __tablename__ = "post_bookmark"
      
   id            = db.Column(db.Integer, primary_key = True)
   post_id       = db.Column(db.Integer, nullable = False)
   user_id       = db.Column(db.Integer, db.ForeignKey("user.id"))
   
   # ================================================================
   # Post source code
   
   source_code = db.Column(db.SmallInteger, default=POST.SOURCE_US, nullable = False)
   
   @property
   def source(self):
      return POST.POST_SOURCE[self.source_code]
      
   @classmethod
   def by_post_id(cls, post_id):
      return cls.query.filter(PostBookmark.post_id == post_id).all()
      
   @classmethod
   def by_all(cls, post_id, user_id, source_code):
      return cls.query.filter(PostBookmark.post_id == post_id, PostBookmark.user_id == user_id, PostBookmark.source_code == source_code).first()
      
   @classmethod
   def by_fb_post_id(cls, feed_id):
      return cls.query.filter(PostBookmark.post_id == feed_id, PostBookmark.source_code == POST.SOURCE_FB).all() 
      
   @classmethod
   def all_fb_posts(cls):
      return cls.query.filter(PostBookmark.source_code == POST.SOURCE_FB).all() 
