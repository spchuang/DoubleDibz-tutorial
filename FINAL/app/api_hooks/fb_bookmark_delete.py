from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager, csrf
from .. import response as Response
from ..tasks.daily_notifications import send_daily_listing_to_user, send_daily_listing_to_list
from ..constants import DELETE_BOOKMARKS_ENDPOINT
from ..posts import PostBookmark

fb_bookmark_delete = Blueprint('fb_bookmark_delete', __name__, url_prefix=DELETE_BOOKMARKS_ENDPOINT)
   
@csrf.exempt
@fb_bookmark_delete.route('/<int:id>', methods=['DELETE'])
def remove_bookmarks_by_post_id(id):
   '''This function is only used by fbsync for now to delete bookmarks when fbpost is deleted'''
   try:
      bookmarks = PostBookmark.by_fb_post_id(id)
      for bookmark in bookmarks:
         db.session.delete(bookmark)
      db.session.commit()
   except Exception as e:
      return Response.make_exception_resp(exception=e)
   return Response.make_success_resp( msg="You have removed this post from your bookmark list!") 