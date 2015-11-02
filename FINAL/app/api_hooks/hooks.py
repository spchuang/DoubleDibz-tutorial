from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from .. import response as Response
from ..tasks.daily_notifications import send_daily_listing_to_user, send_daily_listing_to_list
from ..notifications.tasks import send_system_notification

from ..users.models import UserFacebookAccount

hooks = Blueprint('hooks', __name__, url_prefix='/hidden/super/secret/api/hooks')

@hooks.route('/test_send_daily_listing', methods=['GET'])
def test_send_daily_listing():
   '''
      Send daily FB notification
   '''
   if current_app.config['PROD']:
      list = UserFacebookAccount.get_all_unexpired()
      #list = [10204595193905043, 10154443570545402, 10153030726329972, 10152564134730606]
      send_daily_listing_to_list(list)
      
   return Response.make_data_resp(data="cool")
   
   
@hooks.route('/test_welcome_notification', methods=['GET'])
def test_welcome_notification():
   if not current_app.config['PROD']:
      send_system_notification.delay(3, 0)
   return Response.make_data_resp(data="cool") 