from flask.ext.script import Manager
from flask import url_for, current_app
from app import create_app
from app.config import ProdConfig
from app.extensions import db
from app.users import User,UserSettings,  ADMIN, ACTIVE, MALE
from app.posts import Post
from app.hashtags import Hashtag, CATEGORIES
from app.emails import Email, VERIFIED
from app.circles import Circle, CollegeInfo
import os


def create_my_app(config=None):
   app = None
   app = create_app(config=ProdConfig)
   return app

manager = Manager(create_my_app)

manager.add_option('-c', '--config',
                   dest="config",
                   required=False,
                   help="config [local, dev, prod]")


@manager.command
def initdb():
    """Init/reset database."""

    db.drop_all(bind=None)
    db.create_all(bind=None)

    admin = User(
            first_name=u'admin',
            last_name=u'admin',
            user_name=u'admin',
            password=u'gFcPU5XB',
            role_code=ADMIN,
            status_code=ACTIVE,
            user_settings=UserSettings(
                sex_code=MALE,
                age=10,
                phone='555-555-5555',
                bio=u''))
    email = Email(address= "admin@test.com", is_primary=True, status_code=VERIFIED) 
    admin.add_email(email)
    db.session.add(admin)
    db.session.add(email)
    db.session.commit()
    
        
    hashtag = None
    """Add in all post hashtag"""
    for (key,id) in CATEGORIES.iteritems():
      hashtag = Hashtag(id=id, name = key)     
      db.session.add(hashtag)
    db.session.commit()
    
    #Add in ucla circle
    ucla = Circle(name=u'ucla', description=u'ucla.edu emails only')  
    ucla.add_member(admin)
    db.session.add(ucla)   
    db.session.commit()
       
    ucla_info = CollegeInfo(circle_id = ucla.id, domain=u'ucla.edu',fb_group_id=267279833349705, fb_sell_id=267375200006835)
    db.session.add(ucla_info)
    db.session.commit()
    
  
if __name__ == "__main__":
    manager.run()