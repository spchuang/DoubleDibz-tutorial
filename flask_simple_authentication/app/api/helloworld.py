"""
 Simple API endpoint for returning helloworld
"""
from flask import (Blueprint, render_template, render_template_string, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response)


helloworld = Blueprint('helloworld', __name__, url_prefix='/api/helloworld')

   
@helloworld.route('/helloworld', methods=['GET'])
def index():
   
   data = {
      'message' : "helloworld"
   }      
   return make_response(jsonify(data))

   
@helloworld.route('/csrf', methods=['GET'])
def csrf():
   print session['csrf_token']
   return render_template_string('{{csrf_token()}}')