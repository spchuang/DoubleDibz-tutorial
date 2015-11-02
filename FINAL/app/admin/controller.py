from flask import (Flask, Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify)
                   
from flask.ext.login import login_required, login_user, current_user, logout_user
from ..extensions import db, login_manager
from .. import response as Response
from .admin_users.models import AdminUser
from .admin_users.forms import LoginForm

frontend = Blueprint('frontend', __name__)

@frontend.route('/', methods=['GET'])
def home():
   return redirect(url_for('frontend.login'))
   
# API for dashboard
@frontend.route('/api/admin/user', methods=['GET'])
@login_required
def getUserAPI():
   query = db.engine.execute("SELECT created_at FROM user")
   
   result = [row[0].isoformat() for row in query]
   
   return Response.make_data_resp(data=result) 

@frontend.route('/login', methods=['GET'])
def login():
   print current_app.root_path
   if current_user.is_authenticated():
      return redirect(url_for('admin.index'))
   return render_template('login.html')
   
@frontend.route('/login', methods=['POST'])
def login_attempt():
   form = LoginForm()
   user, authenticated = AdminUser.authenticate(form.username.data, form.password.data) 
   if user and authenticated:
      login_user(user)
      return redirect(url_for('admin.index'))
   return redirect(url_for('frontend.login'))