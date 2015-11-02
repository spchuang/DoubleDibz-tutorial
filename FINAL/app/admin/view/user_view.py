from flask import flash,redirect,url_for, render_template
from jinja2 import Markup
from wtforms.fields import SelectField, TextAreaField

from flask.ext.admin import BaseView, expose, AdminIndexView
from flask.ext.admin.contrib.sqla import ModelView
from flask.ext.admin.contrib.sqla.tools import get_query_for_ids
from flask.ext.admin.form import rules
from flask.ext.admin.actions import action
from flask.ext.admin.babel import gettext, lazy_gettext
from flask.ext.admin.contrib.sqla import filters

from flask.ext.login import login_required, login_user, current_user, logout_user
from app.extensions import db, login_manager
from base import SecureModelView

from app.users.models import User, UserFacebookAccount


def getAdminUserView():
   #auto join user and fb_account
   User.fb_account = db.relationship("UserFacebookAccount", uselist=False, lazy='joined')
   
   #auto join circles
   User.circles = db.relationship("Circle", 
      secondary="circle_user_rel", 
      primaryjoin = "circle_user_rel.c.user_id == User.id",
      secondaryjoin = "circle_user_rel.c.circle_id == Circle.id",
      lazy = 'joined')
   
   return AdminUserView(User, db.session)
      
class AdminUserView(SecureModelView):
   can_create = False
   can_edit = False
   can_delete = False
   
   column_list = ('id', 'user', 'user_name', 'facebook', 'profile', 'circles', 'created_at')
 
   def _user(view, context, model, name):
      link = model.get_picture()['picture']
      name = model.first_name + ' ' + model.last_name
      return Markup('<img style="min-width:80px; max-width:80px" src="%s"> %s' % (link,name))
   
   def _facebook(view, context, model, name):
      if model.fb_account:
         return Markup('<a href="http://www.facebook.com/%s" target="_blank">View</a>' % model.fb_account.fb_id)
      return 'Not connected with FB'
      
   def _profile(view, context, model, name):
      return Markup('<a href="http://www.doubledibz.com/u/%s" target="_blank">view</a>' % (model.user_name))
      
   def _circles(view, context, model, name):
      groups = [i.name for i in model.circles]
      return ','.join(groups)
      return ''
      
   column_formatters = {
      'user' : _user,
      'facebook': _facebook,
      'profile': _profile,
      'circles': _circles
   }
   
   column_searchable_list = ('user_name', User.user_name)
   