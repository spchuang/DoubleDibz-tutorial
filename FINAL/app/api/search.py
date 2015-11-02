from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from ..search import Search, fbsync_search, Aggr_search, init_filters
from .. import response as Response
from ..cache import search_cache as cache

from ..search.constants import ACCEPT_KEYS

search = Blueprint('search', __name__, url_prefix='/api/search')

PER_PAGE = 40

@search.route('', methods=['GET'])
def get_aggr_list():
   
   filters = {}
   for key in ACCEPT_KEYS:
      filters[key] = request.args.get(key)

   filters = init_filters(filters)
 
   data = cache.get_search(filters)
   return Response.make_data_resp(data=data)

@search.route('/normal_feeds', methods=['GET'])
def get_list():
   filters = {
      'name': request.args.get('name'),
      'user_id': request.args.get('u_id'),
      'circle': request.args.get('circle'),
      'hashtag': request.args.get('hashtag')
   }
   order  = request.args.get('order')
   page   = request.args.get('page')
   search = Search(filters, order, page)
   
   if search.setup():
      search.count_posts()

      total, posts = search.get_posts()
   else:
      total, posts = 0, []
   
   return Response.make_data_resp(data={
            'total': total,
            'result': posts,
            'page':  search.page,
            'per_page': search.per_page
         })


@search.route('/fb_feeds', methods=['GET'])
def get_feeds():
   filters = {
      'name': request.args.get('name'),
      'hashtag': request.args.get('hashtag')
   }
   order  = request.args.get('order')
   page   = request.args.get('page')
   search = fbsync_search(filters, order, page)
   search.count_posts()
   total, posts = search.get_posts()
   
   return Response.make_data_resp(data={
            'total': total,
            'result': posts,
            'page':  search.page,
            'per_page': search.per_page
         })
