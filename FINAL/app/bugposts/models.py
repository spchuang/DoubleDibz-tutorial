from ..helpers import JsonSerializer, get_current_time
from ..extensions import db
from . import constants as BUGPOST
from ..constants import STRING_LEN


class BugPostJsonSerializer(JsonSerializer):
   __json_public__ = ['id', 'name', 'description', 'created_at']

class BugPost(db.Model, BugPostJsonSerializer):
   __tablename__ = "bugpost"
   def __repr__(self):
      return '<BugPost %r>' % (self.id)
      
   id            = db.Column(db.Integer, primary_key = True)
   name          = db.Column(db.String(BUGPOST.BUGPOST['NAME_LEN']), nullable = False)
   description   = db.Column(db.String(BUGPOST.BUGPOST['BODY_LEN']), nullable = False)
   created_at    = db.Column(db.DateTime, nullable=False, default = get_current_time)
   user_id       = db.Column(db.Integer, db.ForeignKey("user.id"))  
                     