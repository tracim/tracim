from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import Authenticated


def check_credentials(username, password, request):
    if username == 'admin' and password == 'admin':
        # an empty list is enough to indicate logged-in... watch how this
        # affects the principals returned in the home view if you want to
        # expand ACLs later
        return ['g:admin']
    if username == 'user' and password == 'user':
        return []


class Root:
    # dead simple, give everyone who is logged in any permission
    # (see the home_view for an example permission)
    __acl__ = (
        (Allow, 'g:admin', ALL_PERMISSIONS),
        (Allow, Authenticated, 'user'),
    )