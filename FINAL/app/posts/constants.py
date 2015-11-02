POST_NAME_LEN= 200
POST_BODY_LEN= 1000


# Post status
ACTIVE = 0
PENDING = 1
INACTIVE = 2
POST_STATUS = {
    ACTIVE: 'active',
    PENDING: 'pending',
    INACTIVE: 'inactive',
}

#Post type, same values as fbsync
SELLING = 1
BUYING = 2
POST_TYPE = {
   SELLING: 'selling',
   BUYING: 'buying'
}


# Post Source
SOURCE_US = 0
SOURCE_FB= 1
POST_SOURCE = {
   SOURCE_US: 'us',
   SOURCE_FB: 'facebook'
}

MAX_IMG_PER_POST = 6