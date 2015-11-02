from flask import make_response, jsonify, abort, current_app
from werkzeug.http import HTTP_STATUS_CODES
import sys
import os
import traceback

'''
Helper for making API returns consistent
'''
def _make_json_response(response, code=200):
   #if response type is not defined, use default HTTP status name
   if code is not 200 and not response['errors']['type']:
      response['errors']['type'] = HTTP_STATUS_CODES[code]
   
   return make_response(jsonify(response), code)

def make_success_resp(msg=None):
   response = {
      'success': True,
      'message': msg or ''
   }
   return _make_json_response(response)

def make_data_resp(data, msg=None):
   response = {
      'success': True,
      'data'   : data,
      'message': msg or ''
   }
   return _make_json_response(response)
   
def make_error_resp(msg, type=None, code=400):
   response = {
      'errors': {
         'message' : msg or "Something is wrong!",
         'type'     : type,
         'more info': ''
      }
   }
   return _make_json_response(response, code)
   
def make_form_error_resp(form, msg=None):
   type = 'Form validation error'
   if not msg:
      msg = form.errors
   return make_error_resp(msg=msg, type=type, code=422)
   
def make_exception_resp(exception, type=None, code=500):
   #NOTE: Will probably not want to display excpetion to users in production
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   #include file name, line number and stacktrace
   msg = "Excpetion: %s: %s: %s %s" % (exc_type, fname, exc_tb.tb_lineno, traceback.format_exc())
   if(current_app.config['DEBUG']):
      return make_error_resp(msg=msg, type=type, code=422)
   else:
      current_app.logger.critical('Exception caught:  %s' % msg)
      return make_error_resp(msg="Internal Server Error. Report this problem!", type=type, code=422)