from ..posts.constants import ACTIVE, INACTIVE

# src filter
SRC_ALL = 'all'
SRC_FB  = 'fb'
SRC_US  = 'us'

# Post type filter
POST_TYPE = ['sell', 'buy']
POST_TYPE_SELL = POST_TYPE[0]
POST_TYPE_BUY = POST_TYPE[1]

# order fileter
ORDER_TYPE = ['date-desc', 'price-asc', 'price-desc']

STATUS_TYPE = ['all', "0", "1", "2"]

# time fileter
TIME_TYPE =['today', 'this-week', 'this-month', 'all']
TIME_TODAY = TIME_TYPE[0]
TIME_THIS_WEEK = TIME_TYPE[1]
TIME_THIS_MONTH = TIME_TYPE[2]
TIME_ALL = TIME_TYPE[3]

ACCEPT_KEYS = ['name', 'user_name', 'circle', 'hashtag', 'per_page', 'page', 'order', 'src', 'status', 'from', 'type'] 

DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 36

#default values
DEFAULT_SEARCH_VAL = {
   'name'          : None,
   'user_name'     : None,
   'circle'        : 'ucla', #FOR NOW
   'hashtag'       : None,
   'order'         : 'date-desc',
   'src'           : SRC_ALL,
   'type'          : POST_TYPE_SELL,
   'per_page'      : DEFAULT_PER_PAGE,
   'page'          : DEFAULT_PAGE,
   'status'        : ACTIVE,  
   'from'          : TIME_ALL
}