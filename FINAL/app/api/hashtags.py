from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from ..hashtags import Hashtag, CATEGORIES
from .. import response as Response

hashtags = Blueprint('categories', __name__, url_prefix='/api')

@hashtags.route('/categories', methods=['GET'])
def get_list_categories():
   '''Returns a list of all categories available'''

   return Response.make_data_resp(data=CATEGORIES)
   
@hashtags.route('/hashtags', methods=['GET'])
def get_list_hashtags():
   hashtags = Hashtag.get_all()
   
   return Response.make_data_resp(data=[i.name for i in hashtags])