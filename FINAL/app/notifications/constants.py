#Object Type

POST = 0
USER = 1
SYSTEM = 2
OBJECT_TYPE = {
    POST: 'post',
    USER: 'user',
    SYSTEM: 'system'
}

NOTI_PER_PAGE = 10

#Action Type
POST_EDIT = 0
POST_DELETE = 1
POST_STATUS_INACTIVE = 2
POST_STATUS_ACTIVE = 3
POST_COMMENT = 4
CONTACT_SELLER = 5

SYSTEM_NOTIFICATION = 99
ACTION_TYPE = {
   POST_EDIT: 'post_edit',
   POST_DELETE: 'post_delete',
   POST_STATUS_INACTIVE: 'post_status_inactive',
   POST_STATUS_ACTIVE: 'post_status_active',
   POST_COMMENT: 'post_comment',
   CONTACT_SELLER: 'contact_seller',
   SYSTEM_NOTIFICATION: 'system_notification'
}

#Subscribe Status
UNSUBSCRIBED = 0
SUBSCRIBED = 1
SUBSCRIBE_STATUS = {
    UNSUBSCRIBED: 'unsubscribed',
    SUBSCRIBED: 'subscribed'
}

'''
   System notificaiotn has actor_id = 0, and object_id is the type of notification we sent 
   0 = WELCOME (code in client side)
'''