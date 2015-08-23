import os
from flask import Flask

import config as Config
from .common import constants as COMMON_CONSTANTS
from .api import helloworld

# For import *
__all__ = ['create_app']

DEFAULT_BLUEPRINTS = [
   helloworld
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
   pass

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
   # example
   @app.errorhandler(500)
   def server_error_page(error):
      return "ERROR PAGE!"