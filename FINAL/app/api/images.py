from flask import (Blueprint, render_template, current_app, request,
                   flash, url_for, redirect, session, abort, jsonify, make_response,send_from_directory)

from flask.ext.login import login_required, login_user, current_user, logout_user, confirm_login, login_fresh
from ..extensions import db, login_manager
from ..images import Image, ImageForm, THUMBNAIL_EXTENSION
from .. import response as Response
from ..helpers import allowed_image_file
from ..images import save_shrink_and_thumbnail, get_hash_name, delete_image

import os
import datetime


images = Blueprint('images', __name__, url_prefix='/api/images')


   
@images.route('', methods=['POST'])
@login_required
def upload_image():
   form = ImageForm()

   if form.validate_on_submit():
      file = request.files[form.file.name]
      
      if file and allowed_image_file(file.filename):
         file_data = file.read()

         #create new image file
         image = Image()
         image.user_id = current_user.id
         image.file_name = get_hash_name(file_data, file.filename, current_user.user_name)
         
         try:
            #save shurnk image and thumbnail
            save_shrink_and_thumbnail(file_data, image.file_name)
            
            db.session.add(image)
            db.session.commit()
         except Exception as e:
            return Response.make_exception_resp(exception=e)

         return Response.make_data_resp(data=image.to_json(), msg="You have successfully uploaded the image!") 
         
      else:
         return Response.make_error_resp(msg="File extension not allowed")
         

   return Response.make_form_error_resp(form=form)
   
   
@images.route('/<int:id>', methods=['DELETE'])
@login_required
def delete_image_by_id(id):
   image = Image.by_id(id)
   if not image:
      abort(404, "The image is unavailable")

   try:
      delete_image(image)
      db.session.delete(image)
      db.session.commit()
   except Exception as e:
         return Response.make_exception_resp(exception=e)
   return Response.make_success_resp(msg="You have deleted the image!") 
   
#This should only be for temporary images
@images.route('/uploads/<filename>', methods=['GET'])
def retrieve_image(filename):
   upload_dir = current_app.config['UPLOAD_FOLDER']
   return send_from_directory(upload_dir, filename)
