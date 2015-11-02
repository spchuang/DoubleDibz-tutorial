from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from ..users import User
from .. import response as Response

users = Blueprint('users', __name__, url_prefix='/api/users')


@users.route('/<user_name>', methods=['GET'])
def get_user_info(user_name):
   user = User.by_user_name(user_name);
   if user:
      return Response.make_data_resp(data=user.to_json(private=True))
   
   return Response.make_error_resp(msg="no such user exists", code=404)
