from hapic import Hapic

from tracim_backend.views.processor import TracimProcessor

hapic = Hapic(processor_class=TracimProcessor)

# TODO - G.M - 2018-08-08 - [GlobalVar] Refactor Global var of tracim_backend

# INFO - G.M - 2018-08-08 - app_list
# app_list is one of the few "global_val" in tracim_backend, with hapic
# and all_content_types_validator.
# The goal of this is to be able to get current list of loaded app.
# List is empty until config load apps.
# If you need to update app_list, think about updating Content validator like
# all_content_types_validator , see  update_validators() method
app_list = []
