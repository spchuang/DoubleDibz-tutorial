from ..helpers import JsonSerializer, get_current_time, dump_datetime
from ..extensions import db
from .constants import POST_COMMENT_LEN
from ..users import User

class PostCommentJsonSerializer(JsonSerializer):
   __json_public__ = ['id', 'comment', 'post_id']
   __json_modifiers__ = {
      'created_at'  : ['created_at', (lambda date: dump_datetime(date))],
      'modified_at' : ['modified_at', (lambda date: dump_datetime(date))]
   }
   
class PostComment(db.Model, PostCommentJsonSerializer):
   __tablename__ = "post_comment"
   def __repr__(self):
      return '<PostComment %r>' % (self.id)
      
   id            = db.Column(db.Integer, primary_key = True)
   post_id       = db.Column(db.Integer, db.ForeignKey("post.id"))
   comment       = db.Column(db.String(POST_COMMENT_LEN), nullable = False)
   created_at    = db.Column(db.DateTime, nullable=False, default = get_current_time)
   modified_at   = db.Column(db.DateTime, nullable=False, default = get_current_time, onupdate=get_current_time)
   user_id       = db.Column(db.Integer, db.ForeignKey("user.id"))
   
   user          = db.relationship('User', uselist=False, lazy='joined') 
   
   def to_json(self, user):
      data = super(PostComment, self).to_json()
      
      if user and not user.is_anonymous():
         if user.id == self.user_id:
            data['is_owner'] = True
         else:
            data['is_owner'] = False
         
      data['user'] = self.user.to_json(private=True)
      
      return data

   # ================================================================ 
   # Class methods
   @classmethod
   def by_id(cls, id):
      return cls.query.filter(PostComment.id==id).first()
   
   @classmethod
   def by_post_id(cls, post_id):
      comments = PostComment.query.options(db.joinedload('user')).filter(PostComment.post_id == post_id).all()
      return comments
   
   @classmethod
   def by_user(cls, user):
      return cls.query.filter(PostComment.user_id==user.id).all()
      
   @classmethod
   def by_user_and_id(cls, user, id):
      return cls.query.filter(PostComment.id ==id).filter(PostComment.user_id == user.id).first()

class PostCommentTagging(db.Model):
   __tablename__ = "post_comment_tagging"
   
   id             = db.Column(db.Integer, primary_key = True)
   post_id        = db.Column(db.Integer, db.ForeignKey("post.id"))
   user_id        = db.Column(db.Integer, db.ForeignKey("user.id"))
   tagged_user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
   
   # ================================================================ 
   # Class methods
   @classmethod
   def has_tagged(cls, post_id, user_id, tagged_user_id):
      return db.session.query(db.exists().where(db.and_(\
           PostCommentTagging.post_id==post_id, \
           PostCommentTagging.user_id == user_id, \
           PostCommentTagging.tagged_user_id == tagged_user_id))).scalar()