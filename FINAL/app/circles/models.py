from sqlalchemy.dialects.mysql import BIGINT
from ..helpers import JsonSerializer, get_current_time, dump_datetime
from ..extensions import db
from ..constants import STRING_LEN, EMAIL_LEN
from .constants import DESC_LEN

class CircleJsonSerializer(JsonSerializer):
   __json_public__ = ['id', 'name', 'description']
   __json_modifiers__ = {
      'created_at'  : ['created_at', (lambda date: dump_datetime(date))]
   }

class Circle(db.Model, CircleJsonSerializer):
   __tablename__ = "circle"
   def __repr__(self):
      return '<Circle %r>' % (self.id)
      
   id            = db.Column(db.Integer, primary_key = True)
   name          = db.Column(db.String(STRING_LEN), unique=True, nullable = False)
   description   = db.Column(db.String(DESC_LEN))
   created_at    = db.Column(db.DateTime, nullable=False, default = get_current_time)
   
   # ================================================================
   # Relationships
   
   members = db.relationship("User", 
      secondary="circle_user_rel", 
      primaryjoin = "circle_user_rel.c.circle_id == Circle.id",
      secondaryjoin = "circle_user_rel.c.user_id == User.id",
      backref = db.backref('joined_circles', lazy = 'dynamic'),
      lazy = 'dynamic')   

   posts = db.relationship("Post", 
      secondary="circle_post_rel", 
      primaryjoin = "circle_post_rel.c.circle_id == Circle.id",
      secondaryjoin = "circle_post_rel.c.post_id == Post.id",
      backref = db.backref('joined_circles', lazy = 'joined'),
      lazy = 'dynamic')  

   # ================================================================ 
   # Methods   

   def add_member(self, user):
      self.members.append(user)
      
   def remove_member(self, user):
      self.members.remove(user)
   
   def add_post(self, post):
      self.posts.append(post)
      
   def remove_post(self, post):
      self.posts.remove(post)
   
   def get_fb_group_id(self):
      return CollegeInfo.query.filter_by(circle_id=self.id).first().fb_group_id
   
   def get_college_email(self):
      return CollegeInfo.query.filter_by(circle_id=self.id).first().email
   
   def to_json(self, user):
      data = super(Circle, self).to_json()
      #check if user is a member
      if user.is_member(self):
         data['is_member'] = True
      else:
         data['is_member'] = False

      return data   
   
   
   # ================================================================ 
   # Class methods
   @classmethod
   def by_id(cls, id):
      return cls.query.filter(Circle.id==id).first()
      
   @classmethod
   def by_name(cls, name):
      return cls.query.filter(Circle.name==name).first()

class CollegeInfoJsonSerializer(JsonSerializer):
   __json_public__ = ['id', 'circle_id', 'email', 'fb_group_id']

class CollegeInfo(db.Model, CollegeInfoJsonSerializer):
   __tablename__ = "college_info"

   id            = db.Column(db.Integer, primary_key = True)
   circle_id     = db.Column(db.Integer, db.ForeignKey("circle.id"), nullable=False)
   domain        = db.Column(db.String(EMAIL_LEN), index = True, unique=True, nullable=False)
   fb_group_id   = db.Column(BIGINT(unsigned=True), unique = True, nullable=False)
   fb_sell_id   = db.Column(BIGINT(unsigned=True), unique = True, nullable=False)

   # ================================================================ 
   # Class methods   
   @classmethod
   def by_domain(cls, domain):
      return cls.query.filter(cls.domain==domain).first()   

'''Circle relation tables'''
circle_user_rel = db.Table('circle_user_rel',
   db.Column('circle_id',    db.Integer, db.ForeignKey('circle.id')),
   db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
   db.UniqueConstraint('circle_id', 'user_id')
)                

circle_post_rel = db.Table('circle_post_rel',
   db.Column('circle_id',    db.Integer, db.ForeignKey('circle.id')),
   db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
   db.UniqueConstraint('circle_id', 'post_id')
)                
