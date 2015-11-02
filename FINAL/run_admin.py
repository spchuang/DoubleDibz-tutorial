from flask import Flask, Blueprint, render_template

from flask.ext.admin import Admin

# use settings from main app
from app.extensions import db, login_manager
from app.config import AdminProdConfig, LocalConfig, StagingConfig
from app.models import *
from app.admin import *
from app.admin.admin_users.models import AdminUser


def create_app():
   app = Flask(__name__, static_folder='', template_folder='app/admin/templates')
   print app.root_path
   #load config
   app.config.from_object(AdminProdConfig)
   
   #init extension
   db.init_app(app)
   
   #init login
   login_manager.login_view = "frontend.login"
   @login_manager.user_loader
   def load_user(id):
       return AdminUser.by_id(id)
       
   login_manager.init_app(app)
   
   #init admin
   admin = Admin(name='DD Admin', index_view=HomeView(),url='/admin')
   admin.init_app(app)
   
   admin.add_view(getAdminUserView())
   admin.add_view(getAdminEmailView())
   admin.add_view(getAdminSellingPostView())
   admin.add_view(getAdminBuyRequestView())
   admin.add_view(getAdminHashtagView())
   admin.add_view(getAdminBugPostView())
   
   admin.add_view(LogoutView(name="Logout"))
   
   #register blueprint
   app.register_blueprint(frontend)

   return app


app = create_app()

if __name__ == '__main__':
   
   port = int(os.environ.get("PORT", 5000))
   app.run(host='0.0.0.0', port=port, debug=True)
   