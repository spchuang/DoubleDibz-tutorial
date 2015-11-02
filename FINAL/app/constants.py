import os

#boolean
NO = 0
YES = 1
BOOLEAN = {
   NO : 'no',
   YES: 'yes'
}

# Instance folder path, make it independent.
INSTANCE_FOLDER_PATH = os.path.join('/var/tmp', 'instance')

# Hidden endpoints
DELETE_BOOKMARKS_ENDPOINT = '/4DeQfP1RRLc2gIPCTSh20ZV6dMKTjRk0'

#File Extensions
ALLOWED_IMAGE_EXTENSIONS  = set(['png', 'jpg', 'jpeg'])


# Model
EMAIL_LEN = 254
STRING_LEN = 64
PW_STRING_LEN = 80
FILE_NAME_LEN = 128