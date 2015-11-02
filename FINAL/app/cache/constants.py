INBOX_KEY = 'user:%s:inbox'
POST_KEY  = 'post:%s'
CHAT_KEY  = 'chat:%s'
USER_NAME_KEY  = 'user:%s:name'
NOTI_COUNT_KEY = 'user:%s:notification:count'

#'search:circle:src:hashtag:name:user_name:status:type:from:per_pag:page:order'
# not use '\02' as delimiter (TODO: Might change this)
SEARCH_KEY = 'search\02%s\02%s\02%s\02%s\02%s\02%s\02%s\02%s\02%s\02%s\02%s' 

#Expires constants (in second)
INBOX_EXPIRES = 60 * 60 * 1
NOTI_COUNT_EXPIRES = 60 * 1

DAILY_EXPIRE = 60 * 60 * 24

SEARCH_EXPIRES = 8 