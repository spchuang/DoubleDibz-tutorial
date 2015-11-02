from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager

from ..posts.models import Post
from .helpers import get_bootstrap_data
fb_meta = Blueprint('fb_meta', __name__)


@fb_meta.route('/posts/<int:id>', methods=['GET'])
def fb_meta_post(id):
   '''
      parse normal link. if user agent is fb, render the fb_meta template. if not, redirect back to main
      
   '''
   user_agent = request.headers.get('User-Agent').lower()
   
   if "facebookexternalhit" in user_agent:
      post = Post.by_id(id)
      if not post:
         abort(404)
      
      data = post.to_json(user=None)
      return render_template('fb_meta.html', data=data)

   return render_template('app.html', d=get_bootstrap_data())
   
  
   