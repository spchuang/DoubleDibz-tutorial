## DoubleDibz is open sourced!
[Read a simple intro to the code](http://blog.sampingchuang.com/source-code-for-doubledibz/). The code is somewhat complicated but It should give you a lot of good examples for your next Flask or Backbone application.



Requirements:
* pip
* mysql
* python
* virtualenv
* fabric (1.9)
   
Install pre-requirements
------------------------
    sudo easy_install pip
    sudo pip install virtualenv
    sudo pip install fabric 

Install redis:
---------------------
brew install redis
   
Install mysql on linux:
----------------------
    apt-get install build-essential python-dev libmysqlclient-dev
   
Install mysql on Mac:
---------------------
    homebrew or macport
   
Setup and Deployment
===========================
All terminal control code should be in [manage.py] which uses Flask-Script to automate service related to the app. Then
we use fabric to do autodeployment and setting up. (see [fabfile.py])   
see
http://docs.fabfile.org/en/1.9/tutorial.html

http://flask.pocoo.org/docs/testing/
testing (tests under tests/):
----------------------------
    nosetests -v -s
   

setup (auto):
------------
    fab setup
    fab d

setup (manual):
---------------
    cd /PATH/TO/APP
    virtualenv venv
    source venv/bin/activate
    pip install -r requirements.txt
    [initialize database]
    [start server]

initialize database:
--------------------
    python manage.py initdb
   
start server:
------------
    python manage.py run
    
Front end setup:
----------
   bower-installer (install dependency)
   
   
Admin Page:
--------------
go to /admin to access admin panel
* TODO: add access restrictions to this


REDIS-CLI
--------------
redis-cli -h HOST_NAME -p POST_NAME -n 1

Testing:
--------------
see https://docs.python.org/2/library/unittest.html#classes-and-functions


Build requirejs with r.js
--------------------------
* install nodejs 
* install npm install -g requirejs
* cd app/static/
* r.js -o build.js 
