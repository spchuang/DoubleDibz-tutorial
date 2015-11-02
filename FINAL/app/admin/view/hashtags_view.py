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
from app.hashtags.models import Hashtag
from app.hashtags.constants import CATEGORIES

from base import SecureModelView

def getAdminHashtagView():
   return AdminHashtagView(Hashtag, db.session)

categories_list = [(v, k) for k, v in CATEGORIES.iteritems()]
categories_list.append((0, "None"))
categories_list = sorted(categories_list, key=lambda tup: tup[1])

class AdminHashtagView(SecureModelView):
   page_size = 100
   can_delete = False
   can_edit = False
   column_display_pk = True 
   column_list = ('id', 'name', 'under')
   
   def _under(view, context, model, name):
      if model.under:
         return model.under
      return "None"
      
   column_formatters = {
      'under': _under
   }
   
   form_overrides = dict(under_id=SelectField)
   form_args = dict(
      under_id=dict(
         choices=categories_list, coerce=int)
   )
   page_size = 1000 
   def update_model(self, form, model):
      model.name = form.name.data
      if(form.under_id.data == 0):
         model.under_id = None
      else:
         model.under_id = int(form.under_id.data)
      db.session.add(model)
      db.session.commit()
      return True
   def create_model(self, form):
      model = Hashtag(name = form.name.data)
      if(form.under_id.data == 0):
         model.under_id = None
      else:
         model.under_id = int(form.under_id.data)
      db.session.add(model)
      db.session.commit()
      return True
      
   form_columns =['name','under_id']