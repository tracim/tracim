from hapic import Hapic

hapic = Hapic()

# TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var of tracim_backend

# INFO - G.M - 2018-08-08 - APP_LIST
# APP_LIST is one of the few "global_val" in tracim_backend, with hapic
# and ALL_CONTENT_TYPES_VALIDATOR.
# The goal of this is to be able to get current list of loaded app.
# List is empty until config load apps.
# If you need to update APP_LIST, think about updating Content validator like
# ALL_CONTENT_TYPES_VALIDATOR , see  update_validators() method.
APP_LIST = []
