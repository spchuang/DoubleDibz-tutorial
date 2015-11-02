from flask.ext.script import Manager
from flask import url_for, current_app
from app import create_app
from app.extensions import db
from app.users import User,UserSettings,  ADMIN, ACTIVE, MALE
from app.posts import Post
from app.hashtags import Hashtag, CATEGORIES
from app.emails import Email, VERIFIED
from app.chat import Chat, ChatMessage
from app.circles import Circle, CollegeInfo
import os
from boto.s3.connection import S3Connection, Bucket, Key
from app.images import _get_bucket


def create_my_app(config=None):
   app = create_app()
   return app

manager = Manager(create_my_app)

manager.add_option('-c', '--config',
                   dest="config",
                   required=False,
                   help="config [local, dev, prod]")


@manager.command
def run():
    """Run in local machine."""
    port = int(os.environ.get("PORT", 5000))
    current_app.run(host='0.0.0.0', port=port, debug=True)

@manager.command
def reset_bucket():
   bucket = _get_bucket()
   keys = bucket.get_all_keys()
   for k in keys:
      k.delete()


@manager.command
def initdb():
    """Init/reset database."""

    db.drop_all(bind=None)
    db.create_all(bind=None)

    admin = User(
            first_name=u'admin',
            last_name=u'admin',
            user_name=u'admin',
            password=u'123456',
            role_code=ADMIN,
            status_code=ACTIVE,
            user_settings=UserSettings(
                sex_code=MALE,
                age=10,
                phone='555-555-5555',
                bio=u'admin Guy is ... hmm ... just a admin guy.'))
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
    
    #generate 1000 random post
    '''
    for x in range(0,1000):
      post = Post(name='test-'+str(x), price=10, description='AOH LALAL')
      post.user_id = admin.id
      post.add_hashtag(hashtag)
      db.session.add(post)
   
      db.session.commit()

      chat = Chat(buyer= admin)
      msg = ChatMessage(body = "TEST MESSAGE", created_by = admin.id)
      post.add_chat(chat)
      chat.add_message(msg)
      db.session.commit()

    db.session.commit()
    '''
    
    #Add in ucla circle
    ucla = Circle(name=u'ucla', description=u'ucla.edu emails only')  
    ucla.add_member(admin)
    db.session.add(ucla)   
    db.session.commit()
       
    ucla_info = CollegeInfo(circle_id = ucla.id, domain=u'ucla.edu',fb_group_id=267279833349705, fb_sell_id=267375200006835)
    db.session.add(ucla_info)
    db.session.commit()
    
    
@manager.command
def list_routes():
    import urllib
    output = []
    for rule in current_app.url_map.iter_rules():
        options = {}
        for arg in rule.arguments:
            options[arg] = "[{0}]".format(arg)
            
        #filter out head and options
        methods = ', '.join([i for i in rule.methods if i !='HEAD' and i!='OPTIONS'])
        #url = url_for(rule.endpoint, **options)
        if rule.endpoint != 'static':
           url = "%s" % rule
           
           output.append({
               'endpoint' : rule.endpoint,
               'methods':   methods,
               'url'    :   url
           })


    for line in sorted(output, key=lambda l: l['url']) :
        line = urllib.unquote("{:40s} {:20s} {}".format(line['endpoint'], line['methods'], line['url']))
        print line
        


if __name__ == "__main__":
    manager.run()