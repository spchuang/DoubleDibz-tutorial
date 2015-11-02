import os
from flask.json import JSONEncoder as BaseJSONEncoder
from datetime import datetime, timedelta
from constants import ALLOWED_IMAGE_EXTENSIONS


def get_current_time():
   return datetime.utcnow()
   
def get_current_time_plus(days=0, hours=0, minutes=0, seconds=0):
   return get_current_time() + timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)

#see http://stackoverflow.com/questions/7102754/jsonify-a-sqlalchemy-result-set-in-flask
def dump_datetime(value):
   if value is None:
      return None
   return value.strftime("%Y-%m-%d") +"T"+ value.strftime("%H:%M:%S")+"Z"

def make_dir(dir_path):
    try:
        if not os.path.exists(dir_path):
            os.mkdir(dir_path)
    except Exception, e:
        raise e
      
def allowed_image_file(filename):
    filename = filename.lower()
    return '.' in filename and filename.rsplit('.', 1)[1] in ALLOWED_IMAGE_EXTENSIONS
   
class JSONEncoder(BaseJSONEncoder):
    """Custom :class:`JSONEncoder` which respects objects that include the
    :class:`JsonSerializer` mixin.
    """
    def default(self, obj):
        if isinstance(obj, JsonSerializer):
            return obj.to_json()
        return super(JSONEncoder, self).default(obj)

class JsonSerializer(object):
    """A mixin that can be used to mark a SQLAlchemy model class which
    implements a :func:`to_json` method. The :func:`to_json` method is used
    in conjuction with the custom :class:`JSONEncoder` class. By default this
    mixin will assume all properties of the SQLAlchemy model are to be visible
    in the JSON output. Extend this class to customize which properties are
    public, hidden or modified before being being passed to the JSON serializer.
    """

    __json_public__ = None
    __json_hidden__ = None
    __json_modifiers__ = None

    def get_field_names(self):
        for p in self.__mapper__.iterate_properties: 
            yield p.key

    def to_json(self):
        field_names = self.get_field_names()

        public = self.__json_public__ or field_names
        hidden = self.__json_hidden__ or []
        modifiers = self.__json_modifiers__ or dict()

        rv = dict()
        for key in public:
        
            rv[key] = getattr(self, key)
        for key, modifier in modifiers.items():
            
            value = getattr(self, key)
            if isinstance(modifier, list):
                rv[modifier[0]] = modifier[1](value)
            else:
                rv[key] = modifier(value)
         
        for key in hidden:
            rv.pop(key, None)
        return rv