'''
   Serves Flask static pages
'''
from flask import (Flask, Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, send_from_directory)

frontend = Blueprint('frontend', __name__)

@frontend.route('/')
@frontend.route('/<path:path>')
def index(path=None):   
   return render_template('app.html')
