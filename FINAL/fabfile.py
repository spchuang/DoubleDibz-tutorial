# http://docs.fabfile.org/en/1.9/tutorial.html
from fabric.api import *

project  = 'palexchange'
git_repo = 'https://github.com/spchuang/startup-sell'
www_user = 'www-data'
PYENV    = '.pyenv'
app_dir  = '/var/www/app'
tmp_dir  = '/var/tmp/instance'
uwsgi_file = 'app_uwsgi'

# the user to use for the remote commands
env.user = ''
# the servers where the commands are executed
env.hosts = ['']

#helper
def activate_virtualenv():
   activate_this = ".pyenv/bin/activate_this.py"
   execfile(activate_this, dict(__file__=activate_this))

#environment setup
def stage():
   '''
      staging server is currently the same as jenkin server
   '''
   env.hosts = ['IP']
   env.user  = 'USER_NAME'
   env.password = 'PASSWORD'
   env.type ='staging'
   env.repo = 'staging'

def prod():
   env.hosts = ['IP']
   env.user  = 'USER_NAME'
   env.password = 'PASSWORD'
   env.type ='prod'
   env.repo = 'master'

#Deployingment
def reset_pyenv():
   sudo('virtualenv %s' %PYENV, user=www_user)

def touch_uwsgi():
   sudo('touch /etc/uwsgi/vassals/%s.ini' % uwsgi_file)

def reset_dir():
   '''
      recreate the app folder. set 'server' as directory group and all filed created in the directory will be owned by this group.
   '''
   sudo('rm -rf %s' %app_dir)
   sudo('mkdir %s'  %app_dir, user=www_user)
   sudo('chgrp server %s' %app_dir)
   sudo('chmod g+s %s'%app_dir)
   
def reset_instance():
   sudo('rm -rf %s' %tmp_dir)
   sudo('mkdir %s'%tmp_dir)
   sudo('chown %s:server %s' % (www_user, tmp_dir))
   sudo('chmod g+s %s'%tmp_dir)
   


def reset():
   '''
      reset the folder. Reinstall virtualenv and pull new code and install all dependencies.
   '''
   reset_dir()
   reset_instance()
   with cd(app_dir):
      sudo('git clone %s .' % git_repo, user=www_user)
      sudo('git checkout %s' % env.repo, user=www_user)
      reset_pyenv()
      sudo('%s/bin/pip install -r requirements.txt' %PYENV, user=www_user)
      touch_uwsgi()      
def update():
   with cd(app_dir):  
      sudo('git stash' , user=www_user)
      sudo('git fetch' , user=www_user)
      sudo('git checkout %s' %env.repo, user=www_user)
      sudo('git pull', user=www_user)
      sudo('%s/bin/pip install -r requirements.txt' %PYENV, user=www_user)
      touch_uwsgi()
      
def update_db():
   with cd(app_dir):
      with prefix('source %s/bin/activate' %PYENV):
         sudo('alembic -x env_type=%s upgrade head'%env.type, user=www_user)
   
def uwsgi_tail():
   with cd("/var/log/uwsgi"):
      sudo('tail -100 %s.log' % uwsgi_file)

#local server commands
def test():
   activate_virtualenv()
   local('nosetests -v')


def local_setup():
   local("rm -rf .pyenv")
   local("virtualenv .pyenv")
   activate_virtualenv()
   #handle new versions of xcode
   local("export ARCHFLAGS='-Wno-error=unused-command-line-argument-hard-error-in-future'")
   local("pip install -r requirements.txt")

def d():  
   #run app locally with builtin server
   activate_virtualenv()
   local("python manage.py run")    
   
def p():
   #run with prod setting
   activate_virtualenv()
   
def merge_stage():
   local('git checkout staging')
   local('git merge dev')
   local('git push origin staging')

def compile():
   with lcd('app/static/desktop'):
      local("grunt compile")
   
   local('git add -u . ')
   local('git commit -m "Compile JS/CSS"')
   
def stage_merge():

   local('git checkout staging')
   local('git merge dev')
   local('git push origin staging')
   local('git checkout dev') 

def local_reset():
   #create instance folder
   local("rm -rf /var/tmp/instance")
   local("mkdir /var/tmp/instance")
   activate_virtualenv()
   local("python manage.py initdb")
   local('python manage.py reset_bucket')

