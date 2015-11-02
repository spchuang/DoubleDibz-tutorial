from flask import (Flask, Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify)
from flask.ext.login import login_required, login_user, current_user, logout_user

from flask.ext.admin import BaseView, expose, AdminIndexView
from flask.ext.admin.contrib.sqla import ModelView

class SecureModelView(ModelView):
   page_size = 50 
   def is_accessible(self):
      return current_user.is_authenticated()
      
class LoginView(BaseView):
   @expose('/')
   @login_required
   def index(self):
      return redirect(url_for('frontend.login'))
      
class LogoutView(BaseView):
   @expose('/')
   @login_required
   def index(self):
      logout_user()
      return redirect(url_for('frontend.login'))
      
class HomeView(AdminIndexView):
    @expose('/')
    @login_required
    def index(self):
        return super(HomeView, self).index() 
