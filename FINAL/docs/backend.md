# Backend Documentation

## API Response Handling (see `helpers.py`):

Every API error will return a json response with associate status code. 

```python

def make_success_resp(msg=None):
   return jsonify(success=True, message=msg or '')

def make_data_resp(data, msg=None):
   return jsonify(data=data, success=True, message=msg or '')
   
def make_error_resp(msg, type, code=400):
   response = {
      'errors': {
         'message' : msg or "Something is wrong!",
         'type'     : type or "Bad request",
         'more info': ''
      }
   }
   return make_response(jsonify(response), code)
```

## Flask Error Handler (see `app.py`):

```python
def configure_error_handlers(app):

   @app.errorhandler(500)
   def server_error_page(error):
      return make_error_resp(
         msg   =  '',
         type  =  '500: Internal Server Error',
         code  =  500
         )

   
   @app.errorhandler(422)
   def semantic_error(error):
      return make_error_resp(
         msg   =  error.description['message'],
         type  =  error.description['type'],
         code  =  422
         )

      
   @app.errorhandler(404)
   def page_not_found(error):
      return make_error_resp(
         msg   =  error.description['type'] or 'page not found',
         type  =  error.description['message'] or '',
         code  =  404
         )  
```

## API response:

* Successful request

```javascript
//example structure: 
{
   "data": {},
   "message": "",
   "success": true
}

//example: POST api/account/settings
{  
   "data":{  
      "first_name":"admin",
      "id":1,
      "last_name":"admin",
      "role":"admin",
      "settings":{  
         "age":0,
         "bio":"admin Guy is ... hmm ... just a admin guy.",
         "phone":"",
         "sex_code":0
      },
      "user_name":"admin"
   },
   "message":"",
   "success":true
}   

```

# error request

```javascript
//example structure: 
{
   "errors":{  
      "message":"",
      "more info":"",
      "type":""
   }
}

//example: POST api/auth/login
{  
   "errors":{  
      "message":"Username does not exist",
      "more info":"",
      "type":"Wrong Authentication"
   }
}
```

## Error Codes:

* 400 = Bad Request

* 404 = Not Found
```python
   abort(404, {
      'type': '404 Page Not found',
      'message': ''
   })
```

* 401 = Unauthorized
```python
   #example
   return make_error_resp(msg="You're not authorized!", type="Unauthorized", code=401)

```

* 409 = Conflict (when resource already exists


* 410 = Gone (when resource is not avaliable anymore, expired)

* 422 = Form validation error
```python
   abort(422, {
      'type': 'Form validation error',
      'message': form.errors
   })
```

* 500 = Internal Server Error
```python
   make_error_resp(
      msg   =  str(error),
      type  =  '500: Internal Server Error',
      code  =  500
      )
```


## API Routes (Last update: 7/17):
```
frontend.index                           GET                  /
frontend.api_hander                      GET                  /api/
account.get_emails                       GET                  /api/account/emails
account.add_new_email                    POST                 /api/account/emails
account.delete_email                     POST                 /api/account/emails/<int:id>/delete
account.update_email                     PUT                  /api/account/emails/<int:id>/set_primary
account.change_password                  PUT                  /api/account/password
account.get_settings                     GET                  /api/account/settings
account.update_settings                  PUT                  /api/account/settings
account.verify_auth                      GET                  /api/account/verify_auth
auth.login                               POST                 /api/auth/login
auth.logout                              POST                 /api/auth/logout
auth.signup                              POST                 /api/auth/signup
auth.verify                              GET                  /api/auth/verify
categories.get_list_categories           GET                  /api/categories
images.upload_image                      POST                 /api/images
images.delete_image                      DELETE               /api/images/<int:id>
images.retrieve_image                    GET                  /api/images/uploads/<filename>
posts.get_list_posts                     GET                  /api/posts
posts.create_post                        POST                 /api/posts
posts.get_post                           GET                  /api/posts/<int:id>
posts.update_post                        PUT                  /api/posts/<int:id>
posts.delete_post                        DELETE               /api/posts/<int:id>
search.get_list                          GET                  /api/search/posts
users.get_user_info                      GET                  /api/users
frontend.test_mail                       GET                  /test/mail
```


## Email Scenerios:
Possible email
support@github.com
noreply@XXX.com
notification@XXX.com


#Account Related
* Signup
By default, when the user sign in, his role is `inactive.` An `activation email` will be sent to the user's email address. Once the user click on the email to activate the account, the role will be set to `active`. 
* forgot password
 Sends an email to reset user password
* forgot username
 Sends an email to give username
* Change passwords
* Email verification:

#Normal Cases (depends on email setting)
* Created new selling post
* Someone bid
* message?
* Follow-up email 

