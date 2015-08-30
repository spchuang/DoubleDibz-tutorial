# Flask-SQLAlchemy extension instance
from flask.ext.sqlalchemy import SQLAlchemy
db = SQLAlchemy()

# Flask-Login
from flask.ext.login import LoginManager
login_manager = LoginManager()

# Flask-WTF csrf protection
from flask_wtf.csrf import CsrfProtect
csrf = CsrfProtect()