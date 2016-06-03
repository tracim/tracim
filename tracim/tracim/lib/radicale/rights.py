from tracim.lib.calendar import CalendarManager
from tracim.lib.exceptions import NotFound
from tracim.lib.user import UserApi
from tracim.model.organisational import CALENDAR_PERMISSION_READ


def authorized(user, collection, permission):
    """
    :param user: radicale given user id, should be email
    :param collection: Calendar representation
    :param permission: 'r' or 'w'
    :return: True if user can access calendar with asked permission
    """
    if not user:
        return False
    current_user = UserApi(None).get_one_by_email(user)
    manager = CalendarManager(current_user)
    try:
        calendar = manager.find_calendar_with_path(collection.path)
    except NotFound:
        return False

    if permission == CALENDAR_PERMISSION_READ:
        return calendar.user_can_read(current_user)
    return calendar.user_can_write(current_user)
