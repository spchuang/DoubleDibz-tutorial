from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from ..bugposts import BugPost, ReportBugForm
from .. import response as Response

bugposts = Blueprint('bugposts', __name__, url_prefix='/api/bugposts')

@bugposts.route('', methods=['GET'])
@login_required
def get_list_bugs():
   '''Returns a list of all submitted bugs'''

   bug_posts = BugPost().query.all();
   return Response.make_data_resp(data=[i.to_json() for i in bug_posts])
   
@bugposts.route('', methods=['POST'])
@login_required
def create_bug_post():
   form = ReportBugForm()
   
   if form.validate_on_submit():
      try: 
         bug_post = BugPost()
         form.populate_obj(bug_post)
         bug_post.user_id = current_user.id
         
         db.session.add(bug_post)
         db.session.commit()
         
      except Exception as e:
         return Response.make_exception_resp(exception=e)
         
      data = bug_post.to_json()
      return Response.make_data_resp(data=data,  msg="Thank you! Your thoughts mean the world to us.!")
   
   return Response.make_form_error_resp(form=form)  