from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager, csrf

from .. import response as Response
from ..posts import Post, PostBookmark, SOURCE_US, SOURCE_FB
from ..users import User
from ..fbsync import FBFeed

bookmarks = Blueprint('fbsync', __name__, url_prefix='/api/bookmarks')

'''
   Helper functions for bookmarks
'''

def get_bookmarked_posts(user):
   '''
      Get aggregate posts then order them by date descending. Possibly add pagination in future?
   '''
   posts = _get_all_bookmark_posts(user)
   posts.sort(key=lambda k: k['created_at'], reverse=True)
   return posts
   
def _get_all_bookmark_posts(user):
   '''
      Get posts from all sources then aggregate them together.
   '''
   our_posts = Post.query.join(PostBookmark, PostBookmark.post_id == Post.id).filter(PostBookmark.user_id == user.id).filter(PostBookmark.source_code == SOURCE_US)
   
   fb_bookmarks = PostBookmark.query.filter(PostBookmark.user_id == user.id, PostBookmark.source_code == SOURCE_FB).all()
   if len(fb_bookmarks) > 0:
      feed_ids = [i.post_id for i in fb_bookmarks]
      fb_posts = FBFeed.query.filter(FBFeed.id.in_(feed_ids))
   else:
      fb_posts = []
    
   return [i.to_json(user=user, get_chat=False, get_hashtags=False, get_bookmarks=True) for i in our_posts] + [i.to_json(user=user, get_bookmarks=True) for i in fb_posts]


ACCEPT_TYPES = ['fb', 'us']

def get_bookmark_src(type):
   if type not in ACCEPT_TYPES:
      abort(422, "Wrong bookmark type") 
   return SOURCE_FB if type == "fb" else SOURCE_US

def get_bookmark(id, src):
   if src == SOURCE_FB:
      post = FBFeed.by_id(id)
   else:
      post = Post.by_id(id)
   if not post:
      abort(404, "The post is unavailable")
   return PostBookmark.by_all(post.id, current_user.id, src)
   
def create_bookmark(id, src):
   bookmark = get_bookmark(id, src)
   if not bookmark:
      bookmark = PostBookmark(post_id=id, user_id=current_user.id, source_code=src)
      db.session.add(bookmark)
   db.session.commit()

def delete_bookmark(id, src):
   bookmark = get_bookmark(id, src)
   if not bookmark:
      abort(404, "The bookmark is unavailable")
   db.session.delete(bookmark)
   db.session.commit()
   
#--------------------------------------------
@bookmarks.route('/<string:type>/<int:id>', methods=['GET'])
@login_required
def get_bookmark_status(type, id):
   try:
      src = get_bookmark_src(type)
      has_bookmarked = PostBookmark.by_all(id, current_user.id, src) != None
      return Response.make_data_resp(data={'has_bookmarked': has_bookmarked} , msg="")

   except Exception as e:
     return Response.make_exception_resp(exception=e)
   return Response.make_success_resp(msg="You have bookmarked this post!")    

@bookmarks.route('', methods=['GET'])
@login_required
def get_bookmarks():
   "Return user bookmarks"
   posts = get_bookmarked_posts(current_user)
   return Response.make_data_resp(data=posts)

@bookmarks.route('/<string:type>/<int:id>', methods=['POST'])
@login_required
def add_bookmark(type, id):
   try:
      src = get_bookmark_src(type)
      create_bookmark(id, src)
   except Exception as e:
      return Response.make_exception_resp(exception=e)
   return Response.make_success_resp(msg="You have bookmarked this post!")
   
 
@bookmarks.route('/<string:type>/<int:id>', methods=['DELETE'])
@login_required
def remove_bookmark(type, id):
   try:
      src = get_bookmark_src(type)
      delete_bookmark(id, src)
   except Exception as e:
      return Response.make_exception_resp(exception=e)
   return Response.make_success_resp( msg="You have removed this post from your bookmark list!")