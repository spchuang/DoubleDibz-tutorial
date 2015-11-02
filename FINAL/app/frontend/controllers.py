'''
   Serves Flask static pages (index, login, signup, etc)
'''
from flask import (Flask, Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, send_from_directory)
from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
import simplejson as json
from ..users import User
from .. import response as Response
from ..extensions import csrf
from .helpers import get_bootstrap_data

frontend = Blueprint('frontend', __name__)

@frontend.route('/robots.txt')
def static_from_root():
   return redirect(url_for('static', filename='robots.txt'), code=301)

@frontend.route('/')
@frontend.route('/<path:path>')
def index(path=None):   
   #pass in authentication info...
   return render_template('app.html', d=get_bootstrap_data())

@csrf.exempt   
@frontend.route('/fb/redirect', methods=['GET', 'POST'])
def fb_messages_redirect():
   r_type = request.args.get('type')
   
   if current_user.is_anonymous():
      return render_template('fb_login.html')
   
   if r_type == "messages":
      msg_type = request.args.get('msg_type')
      post_id = request.args.get('post_id')
      chat_id = request.args.get('chat_id')
      return redirect('/fb/messages/%s/%s/%s' % (msg_type, post_id, chat_id))
   elif r_type == "posts":
      post_id = request.args.get('post_id')
      return redirect('/fb/posts/%s' % (post_id))   
   elif r_type == "daily-listing":
      return redirect('/fb/daily-listing')
   else:
      return redirect('/fb/me')   
 
@frontend.route('/fb/<path:path>', methods=['GET','POST'])
def fb_index(path=None):   
   return render_template('app.html', is_canvas=1, d=get_bootstrap_data())

@frontend.route('/api/')
@frontend.route('/api/<path:path>')
def api_hander(path=None):
   abort(404, {
      'type': 'Invalid API path',
      'message': 'nope'
   })
 