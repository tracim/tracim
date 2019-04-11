# coding: utf-8
import typing

from tracim_backend.lib.calendar.utils import DavAuthorization
from tracim_backend.lib.utils.logger import logger

if typing.TYPE_CHECKING:
    from tracim_backend import TracimRequest


CALDAV_READ_METHODS = [
    'GET',
    'HEAD',
    'OPTIONS',
    'PROPFIND',
    'LOCK',
    'UNLOCK',
    'REPORT',
]
CALDAV_WRITE_METHODS = [
    'PUT',
    'DELETE',
    'POST',
    'PROPPATCH',
    'COPY',
    'MOVE',
    'MKCOL',
    'MKCALENDAR',
]


class CaldavAuthorizationDeterminer(object):
    def determine_requested_mode(self, request: 'TracimRequest') -> DavAuthorization:
        if request.method in CALDAV_READ_METHODS:
            return DavAuthorization.READ
        elif request.method in CALDAV_WRITE_METHODS:
            return DavAuthorization.WRITE
        else:
            logger.warning(
                self,
                'Unknown http method "{}" authorization will be WRITE'.format(request.method),
            )
            return DavAuthorization.WRITE
