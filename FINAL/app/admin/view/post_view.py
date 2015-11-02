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
from app.posts.models import SellingPost

from base import SecureModelView

def getAdminSellingPostView():
   return AdminSellingPostView(SellingPost, db.session)

class AdminSellingPostView(SecureModelView):
   can_create = False
   can_edit = False
   can_delete = False
   column_searchable_list = ('description', SellingPost.description)
   column_default_sort = ('created_at' , True)
   column_filters = ('id','description', 'price', 'created_at','modified_at')
   
   column_list = ('id', 'name', 'user', 'pictures', 'price', 'description', 'status', 'hashtags')
   
   def _name(view, context, model, name):
      return Markup('<a href="http://www.doubledibz.com/posts/%s" target="_blank">%s</a>' % (model.id, model.name))
   
   def _user(view, context, model, name):
      return Markup('<a href="http://www.doubledibz.com/u/%s" target="_blank">%s</a>' % (model.user.user_name, model.user.user_name))
   
   def _status(view, context, model, name):
      return model.status
      
   def _hashtags(view, context, model, name):
      return [i.name for i in model.hashtags]
      
   def _pictures(view, context, model, name):
      if not model.images:
         return 'no images'
      thumbs_html = ''
      for i in model.images:
         thumbs_html +=  Markup('<img style="min-width:150px; max-width:150px" src="%s"><br>' % (i.to_json()['thumbnail']))
      return thumbs_html
   
   column_formatters = {
      'name' : _name,
      'pictures': _pictures,
      'user' : _user,
      'status': _status,
      'hashtags': _hashtags
   }