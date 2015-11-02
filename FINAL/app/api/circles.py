from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from .. import response as Response
from ..circles import Circle

circles = Blueprint('circles', __name__, url_prefix='/api/circles')

@circles.route('', methods=['GET'])
@login_required
def get_all_circles():
   circles = Circle.query.all()
   return Response.make_data_resp(data=[i.to_json(user=current_user) for i in circles])

@circles.route('/<int:id>', methods=['GET'])
@login_required
def get_circle_info(id):
   circle = Circle.by_id(id)
   return Response.make_data_resp(data=circle.to_json(user=current_user))

@circles.route('/<int:id>/posts', methods=['GET'])
@login_required
def get_circle_posts(id):
   circle = Circle.by_id(id)
   posts = circle.posts.all()
   return Response.make_data_resp(data=[i.to_json(user=current_user) for i in posts])
   
@circles.route('/<int:id>/users', methods=['GET'])
@login_required
def get_circle_members(id):
   circle = Circle.by_id(id)
   members = circle.members.all()
   return Response.make_data_resp(data=[i.to_json() for i in members])