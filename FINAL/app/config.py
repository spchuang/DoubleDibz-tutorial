import os
from .constants import INSTANCE_FOLDER_PATH
from helpers import make_dir

class BaseConfig(object):
   PROJECT = "app" 
   
   
   # Get app root path, also can use flask.root_path.
   PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
   
   DEBUG = False
   USE_EMAIL = True
   TESTING = False
   PROD      = False
   
   ADMINS = ['youremail@yourdomain.com']
   
   #for session
   SECRET_KEY = 'RANDOM_SECRET_KEY'
   API_ROOT = 'api'
   
   make_dir(INSTANCE_FOLDER_PATH)
   
   LOG_FOLDER = os.path.join(INSTANCE_FOLDER_PATH, 'logs')
   make_dir(LOG_FOLDER)
   
   # Fild upload, should override in production.
   # Limited the maximum allowed payload to 8 megabytes.
   # http://flask.pocoo.org/docs/patterns/fileuploads/#improving-uploads
   MAX_CONTENT_LENGTH = 8 * 1024 * 1024
   UPLOAD_FOLDER = os.path.join(INSTANCE_FOLDER_PATH, 'uploads')
   make_dir(UPLOAD_FOLDER)
   
   
class DefaultConfig(BaseConfig):
   SITE_NAME = "DoubleDibz"
   # Enable protection agains *Cross-site Request Forgery (CSRF)*
   WTF_CSRF_ENABLED = True
   
   # Define the database setting
   DB_CONFIG = {
      "HOST" : "TEST_DB_HOST",
      "USER" : "USER_NAME",
      "PASS" : "PASSWORD",
      "DB"   : "staging"
   }
   SQLALCHEMY_ECHO = False
   SQLALCHEMY_DATABASE_URI = "mysql://%s:%s@%s/%s?charset=utf8"%(DB_CONFIG['USER'], DB_CONFIG['PASS'],DB_CONFIG['HOST'],DB_CONFIG['DB'])
   SQLALCHEMY_BINDS = {
       'fbsync':   "mysql://%s:%s@%s/fbsync?charset=utf8"%(DB_CONFIG['USER'], DB_CONFIG['PASS'],DB_CONFIG['HOST']),
   }
   SQLALCHEMY_POOL_RECYCLE = 7200
   #MAIL (sendgrid)
   USE_EMAIL = False
   MAIL_DEBUG = False
   MAIL_DEFAULT_SENDER = 'DEFAULT_SENDER'
   MAIL_SERVER = 'smtp.sendgrid.net'
   MAIL_PORT = 587
   MAIL_USE_TLS = True
   MAIL_USE_SSL = False
   MAIL_USERNAME = 'SENDGRID_USER'
   MAIL_PASSWORD = 'SENDGRID_PASSWORD'
   
   #oauth info
   FACEBOOK_APP_ID = 'FB_ID'
   FACEBOOK_APP_SECRET = 'FB_SECRET'
   FACEBOOK_APP_TOKEN = FACEBOOK_APP_ID + '|' + FACEBOOK_APP_SECRET
   
   #S3
   S3_BUCKET = 'S3_BUCKET'
   S3_REGION_ENDPOINT = 's3-us-west-1.amazonaws.com'

   #redis
   REDIS_CONFIG = {
      'HOST': 'TEST_REDIS_HOST',
      'PORT': '2953',
      'CELERY_DB': '0',
      'CACHE_DB' : '1'
   }
   
   #celery config
   BROKER_URL = 'redis://%s:%s/0'%(REDIS_CONFIG['HOST'], REDIS_CONFIG['PORT'])
   CELERY_RESULT_BACKEND = 'redis://%s:%s/0'%(REDIS_CONFIG['HOST'], REDIS_CONFIG['PORT'])
   CELERY_RESULT_ENGINE_OPTIONS = {"pool_recycle": 7200, 'echo': True}
   
   
   
   
class LocalConfig(DefaultConfig):
   DEBUG = True
   USE_EMAIL = False
   DOMAIN_NAME = 'localhost:5000'
   SQLALCHEMY_ECHO = False
   PROD      = False
   
   
class TestConfig(BaseConfig):
   #Set Testing to False so we still have authentication when unit testing
   WTF_CSRF_ENABLED = False
   DOMAIN_NAME = 'localhost:5000'
   TESTING = False
   USE_EMAIL = False
   SQLALCHEMY_ECHO = False
   SQLALCHEMY_DATABASE_URI = 'sqlite://'
   
class StagingConfig(DefaultConfig):
   DOMAIN_NAME = 'STAGING_DOMAIN'
   DEBUG = False
   USE_EMAIL = False
   PROD      = True
   
class ProdConfig(DefaultConfig):
   DOMAIN_NAME = 'www.doubledibz.com'
   DEBUG = False
   USE_EMAIL = True
   PROD      = True
   DB_CONFIG = {
      "HOST" : "PROD_DB_HOST",
      "USER" : "USERNAME",
      "PASS" : "PASSWORD",
      "DB"   : "prod"
   }
   S3_BUCKET = 'xchangeup'
   
   SQLALCHEMY_ECHO = False
   SQLALCHEMY_DATABASE_URI = "mysql://%s:%s@%s/%s?charset=utf8"%(DB_CONFIG['USER'], DB_CONFIG['PASS'],DB_CONFIG['HOST'],DB_CONFIG['DB'])
   

   REDIS_CONFIG = {
      'HOST': 'PROD_REDIS_HOST',
      'PORT': '4352',
      'CELERY_DB': '0',
      'CACHE_DB' : '1'
   }

   
class AdminProdConfig(ProdConfig):
   SQLALCHEMY_ECHO = False

   # for admin purposes
   INTERNAL_CONFIG = {
      "HOST" : "ADMIN_SERVER_HOST",
      "USER" : "USERNAME",
      "PASS" : "PASSWORD"
   }

   SQLALCHEMY_BINDS = {
       'internal':   "mysql://%s:%s@%s/internal?charset=utf8"%(INTERNAL_CONFIG['USER'], INTERNAL_CONFIG['PASS'],INTERNAL_CONFIG['HOST']),
   }
   
def get_config(MODE):
   SWITCH = {
      'LOCAL'     : LocalConfig,
      'STAGING'   : StagingConfig,
      'PRODUCTION': ProdConfig
   }
   return SWITCH[MODE]
