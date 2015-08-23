# Flask-SQLAlchemy extension instance
from flask.ext.sqlalchemy import SQLAlchemy
db = SQLAlchemy()

# Flask-WTF csrf protection
from flask_wtf.csrf import CsrfProtect
csrf = CsrfProtect()