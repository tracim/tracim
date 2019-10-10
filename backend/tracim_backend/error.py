from enum import IntEnum

# Error code format
# 1xxx: not found error
# 2xxx: validation error
# 3xxx: conflict error
# 4xxx: authentication and authorization
# 9xxx: core errors(family of error code reserved
# for unclassable errors or very low level errors)


class ErrorCode(IntEnum):
    # Tracim Not found Error
    USER_NOT_FOUND = 1001
    WORKSPACE_NOT_FOUND = 1002
    CONTENT_NOT_FOUND = 1003
    PARENT_NOT_FOUND = 1004
    USER_ROLE_NOT_FOUND = 1005
    CONTENT_TYPE_NOT_EXIST = 1006
    CONTENT_SHARE_NOT_FOUND = 1007
    UPLOAD_PERMISSION_NOT_FOUND = 1008
    # Preview Based
    UNAVAILABLE_PREVIEW_TYPE = 1011
    PAGE_OF_PREVIEW_NOT_FOUND = 1012
    UNAIVALABLE_PREVIEW = 1013

    # Validation Error
    GENERIC_SCHEMA_VALIDATION_ERROR = 2001
    INTERNAL_TRACIM_VALIDATION_ERROR = 2002
    EMPTY_COMMENT_NOT_ALLOWED = 2003
    INVALID_STATUS_CHANGE = 2004
    NO_FILE_VALIDATION_ERROR = 2005
    # Not in Tracim Request #
    USER_NOT_IN_TRACIM_REQUEST = 2011
    WORKSPACE_NOT_IN_TRACIM_REQUEST = 2012
    CONTENT_NOT_IN_TRACIM_REQUEST = 2013
    CONTENT_TYPE_NOT_IN_TRACIM_REQUEST = 2014
    # Invalid ID #
    USER_INVALID_USER_ID = 2021
    WORKSPACE_INVALID_ID = 2022
    CONTENT_INVALID_ID = 2023
    COMMENT_INVALID_ID = 2024

    # Other #
    CONTENT_TYPE_NOT_ALLOWED = 2031
    WORKSPACE_DO_NOT_MATCH = 2032
    PREVIEW_DIM_NOT_ALLOWED = 2033
    WRONG_USER_PASSWORD = 2034
    PASSWORD_DO_NOT_MATCH = 2035
    EMAIL_ALREADY_EXIST_IN_DB = 2036
    # deprecated params
    EMAIL_VALIDATION_FAILED = 2037

    UNALLOWED_SUBCONTENT = 2038
    INVALID_RESET_PASSWORD_TOKEN = 2039
    EXPIRED_RESET_PASSWORD_TOKEN = 2040
    SAME_VALUE_ERROR = 2041
    USER_NOT_ACTIVE = 2042
    USER_DELETED = 2043
    CONTENT_IN_NOT_EDITABLE_STATE = 2044
    NOTIFICATION_SENDING_FAILED = 2045
    NOTIFICATION_DISABLED_CANT_RESET_PASSWORD = 2046
    NOTIFICATION_DISABLED_CANT_NOTIFY_NEW_USER = 2047
    EXTERNAL_AUTH_USER_EMAIL_MODIFICATION_UNALLOWED = 2048
    EXTERNAL_AUTH_USER_PASSWORD_MODIFICATION_UNALLOWED = 2049
    USER_AUTH_TYPE_DISABLED = 2050
    WORKSPACE_AGENDA_DISABLED = 2051
    FILE_TEMPLATE_NOT_AVAILABLE = 2052
    WRONG_SHARE_PASSWORD = 2053
    WORKSPACE_PUBLIC_UPLOAD_DISABLED = 2054
    WORKSPACE_PUBLIC_DOWNLOAD_DISABLED = 2055
    CONTENT_NAMESPACE_DO_NOT_MATCH = 2060
    # Conflict Error
    USER_ALREADY_EXIST = 3001
    CONTENT_FILENAME_ALREADY_USED_IN_FOLDER = 3002
    USER_CANT_DISABLE_HIMSELF = 3003
    USER_CANT_DELETE_HIMSELF = 3004
    USER_CANT_REMOVE_IS_OWN_ROLE_IN_WORKSPACE = 3005
    USER_CANT_CHANGE_IS_OWN_PROFILE = 3006
    USER_ROLE_ALREADY_EXIST = 3008
    CONFLICTING_MOVE_IN_ITSELF = 3009
    CONFLICTING_MOVE_IN_CHILD = 3010

    # Auth Error
    AUTHENTICATION_FAILED = 4001
    # Right Error
    INSUFFICIENT_USER_PROFILE = 4002
    INSUFFICIENT_USER_ROLE_IN_WORKSPACE = 4003

    # Caldav
    CALDAV_NOT_AUTHORIZED = 5001
    CALDAV_NOT_AUTHENTICATED = 5002
    # Quota limit
    USER_NOT_ALLOWED_TO_CREATE_MORE_WORKSPACES = 6001
    FILE_SIZE_OVER_MAX_LIMITATION = 6002
    FILE_SIZE_OVER_WORKSPACE_EMPTY_SPACE = 6003
