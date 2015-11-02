import constants as CONSTANTS
from ..helpers import get_current_time, get_current_time_plus


def parse_default_int(filters, key):
   
   try:
       filters[key] = int(filters[key])
   except:
       filters[key] = CONSTANTS.DEFAULT_SEARCH_VAL[key]

   #treat negative val
   if filters[key] < 1: filters[key] = CONSTANTS.DEFAULT_SEARCH_VAL[key]


def init_filters(filters):
   #fallback to default values if key doesn't exist or is None 
   for key in CONSTANTS.DEFAULT_SEARCH_VAL:
      if not key in filters or filters[key] is None:
         filters[key] = CONSTANTS.DEFAULT_SEARCH_VAL[key]
         
   #convert to unicode
   filters['status'] = str(filters['status'])
   
   #treat per_page and page for integer
   parse_default_int(filters, 'page')
   parse_default_int(filters, 'per_page')
   
   #set order to default
   if filters['order'] not in CONSTANTS.ORDER_TYPE:
      filters['order'] = CONSTANTS.DEFAULT_SEARCH_VAL['order']
   
   #set time to default 
   if filters['from'] not in CONSTANTS.TIME_TYPE:
      filters['from'] = CONSTANTS.DEFAULT_SEARCH_VAL['from']
      
   #set status to default
   if filters['status'] not in CONSTANTS.STATUS_TYPE:
      filters['status'] = CONSTANTS.DEFAULT_SEARCH_VAL['status']
      
   if filters['type'] not in CONSTANTS.POST_TYPE:
      filters['type'] = CONSTANTS.DEFAULT_SEARCH_VAL['type']
   
   #get lower case hashtag
   if filters['hashtag']:
      filters['hashtag'] = filters['hashtag'].lower()

   #if type is buy, then ignore order
   if filters['type'] == CONSTANTS.POST_TYPE_BUY:
      filters['order'] = CONSTANTS.DEFAULT_SEARCH_VAL['order']
   
   return filters
   
def get_search_time(time_type):
   # Return date or None
   if time_type == CONSTANTS.TIME_TODAY:
      return get_current_time_plus(days = -1)
   elif time_type == CONSTANTS.TIME_THIS_WEEK:
      return get_current_time_plus(days = -7)
   elif time_type == CONSTANTS.TIME_THIS_MONTH:
      return get_current_time_plus(days = -30)
   return None
   
   
def apply_order_query(query, order, Object):
   if order == 'date-desc':
      query = query.order_by(Object.created_at.desc())
   elif order == 'price-asc':
      query = query.order_by(Object.price.asc())
   elif order == 'price-desc':
      query = query.order_by(Object.price.desc())
   return query