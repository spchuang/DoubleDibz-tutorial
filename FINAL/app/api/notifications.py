from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from .. import response as Response
from ..notifications import Notification
from ..notifications.constants import NOTI_PER_PAGE

from ..cache import notification_cache as cache

notifications = Blueprint('notifications', __name__, url_prefix='/api/notifications')

'''Return a list of 10 of the current user's notifications'''
@notifications.route('', methods=['GET'])
@login_required
def get_notifications():
   page = request.args.get('page')
   try:
      page = int(page)
   except:
      page = 1
      
   total, data  = cache.get_notification(current_user.id, page, NOTI_PER_PAGE)
   unread_count = cache.get_notification_unread_count(current_user.id)

   if page * NOTI_PER_PAGE < total:
      next_page = page+1
      next = url_for('notifications.get_notifications', page=str(page+1), _external=True)
   else:
      next_page = None
      next = None
   
   return Response.make_data_resp(data={
            'result': data,
            'next': next,
            'page':  page,
            'per_page': 10,
            'next_page': next_page,
            'unread_count': unread_count
         })
         
@notifications.route('/<int:id>/read', methods=['PUT'])
@login_required
def set_read(id):
   
   notification = Notification.by_user_and_id(current_user.id, id)
   if not notification:
      abort(404, "The notification is unavailable or doesn't belong to you")
      
   #set read status. If it returns true, commit the changes
   if notification.set_read():
      try:
         db.session.add(notification)
         db.session.commit()
         cache.decr_notification_count(current_user.id)
      except Exception as e:
         return Response.make_exception_resp(exception=e)

   return Response.make_success_resp(msg='')   