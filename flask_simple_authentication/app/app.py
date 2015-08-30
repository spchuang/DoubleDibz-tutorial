import os
from flask import Flask, request

import config as Config
from .common import Response
from .common import constants as COMMON_CONSTANTS
from .api import helloworld, auth
from .frontend import frontend
from .models import User
from .extensions import db, login_manager, csrf


# For import *
__all__ = ['create_app']

DEFAULT_BLUEPRINTS = [
   helloworld,
   auth,
   frontend,
]

def create_app(config=None, app_name=None, blueprints=None):
   """Create a Flask app."""

   if app_name is None:
     app_name = Config.DefaultConfig.PROJECT
   if blueprints is None:
     blueprints = DEFAULT_BLUEPRINTS

   app = Flask(app_name, instance_path=COMMON_CONSTANTS.INSTANCE_FOLDER_PATH, instance_relative_config=True)
   configure_app(app, config)
   configure_hook(app)
   configure_blueprints(app, blueprints)
   configure_extensions(app)
   configure_logging(app)
   configure_error_handlers(app)
   
   return app

def configure_app(app, config=None):
   """Different ways of configurations."""

   # http://flask.pocoo.org/docs/api/#configuration
   app.config.from_object(Config.DefaultConfig)

   if config:
     app.config.from_object(config)
     return

   # get mode from os environment
   application_mode = os.getenv('APPLICATION_MODE', 'LOCAL')
   app.config.from_object(Config.get_config(application_mode))

def configure_extensions(app):
   # flask-sqlalchemy
   db.init_app(app)
   
   # flask-login

   @login_manager.user_loader
   def load_user(id):
      return User.query.get(id)

   login_manager.setup_app(app)

   @login_manager.unauthorized_handler
   def unauthorized(msg=None):
      '''Handles unauthorized request  '''
      return Response.make_error_resp(msg="You're not authorized!", code=401)
      
   # flask-wtf
   csrf.init_app(app)


def configure_blueprints(app, blueprints):
   for blueprint in blueprints:
      app.register_blueprint(blueprint)

def configure_logging(app):
    pass

def configure_hook(app):
   @app.before_request
   def before_request():
      pass

def configure_error_handlers(app):
   @app.errorhandler(500)
   def server_error_page(error):
      return Response.make_error_resp(msg=str(error), code=500)  

   @app.errorhandler(422)
   def semantic_error(error):
      return Response.make_error_resp(msg=str(error.description), code=422)

   @app.errorhandler(404)
   def page_not_found(error):
      return Response.make_error_resp(msg=str(error.description), code=404)

   @app.errorhandler(403)
   def page_forbidden(error):
      return Response.make_error_resp(msg=str(error.description), code=403)

   @app.errorhandler(400)
   def page_bad_request(error):
      return Response.make_error_resp(msg=str(error.description), code=400)