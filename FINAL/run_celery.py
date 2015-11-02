from app import create_app
from app.extensions import celery

app = create_app()

with app.app_context():
   celery.start()