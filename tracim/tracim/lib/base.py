# -*- coding: utf-8 -*-

"""The base Controller API."""

import logging

import tg
from tg import TGController, RestController, tmpl_context, flash
from tg.render import render
from tg import request, redirect
from tg.i18n import ugettext as _, ungettext

__all__ = ['BaseController']


class BaseController(TGController):
    """
    Base class for the controllers in the application.

    Your web application should have one of these. The root of
    your application is used to compute URLs used by your app.

    """

    def __call__(self, environ, context):
        """Invoke the Controller"""
        # TGController.__call__ dispatches to the Controller method
        # the request is routed to.

        request.identity = request.environ.get('repoze.who.identity')
        tmpl_context.identity = request.identity
        return TGController.__call__(self, environ, context)

    @property
    def parent_controller(self):
        possible_parent = None
        for path, controller in self.mount_steps:
            if controller==self:
                break
            possible_parent = controller
        return possible_parent

    def url(self, id: int=None, subpath: str='', params:dict=None, skip_id=False) -> str:
        """
        return a standard REST URL for list or one item.
        If your mount point is /someitems, then this will return /someitems or /someitems/4 if id not None
        if subpath is given, then it will be added at the end, eg /someitems/subpath or /someitems/4/subpath
        :param id:
        :param subpath: path to be concatenated after the base url
        :param params: url parameters given as dict
        :param skip_id: by default, the method tris to find an item in tmpl_context (and will return the related url).
            If skip_id is True, then force to return default url (with no specific content)
        :return:
        """

        url = ''

        for step in self.mount_steps:
            path = step[0]
            controller = step[1]
            url = '/'.join([url.rstrip('/'), path.rstrip('/')]) # we always remove trailing slash

            # LOW-LEVEL DEBUG related log
            # logger.debug(self, ' Looking for item related to controller {} [type: {}]'.format(path, controller.__class__))

            if not skip_id:
                if id and self==controller:
                    url = '/'.join([url, str(id)])
                elif controller.current_item_id():
                    url = '/'.join([url, '{}'.format(controller.current_item_id())])

        if subpath:
            url = '/'.join([url, subpath])

        return tg.url(url, params)

    @classmethod
    def current_item_id_key_in_context(cls) -> str:
        """
        :return: the key name for getting item from tmpl_context.
        """
        raise NotImplementedError('This method must be implemented in sub-classes.')

    @classmethod
    def current_item_id(cls) -> int:
        """
        This method is to be implemented in child classes.
        It should return the id of the item related to the current REST controller in case of a REST controller or None
        example:

        WorkspaceController should return the current workspace id (if there is one) according to the url (eg if the url is /user/workspace/4/members, then it should return 4

        The implementation is to find the item in the current context through tmpl_context.

        if the id parameter is given, then force to use this id (otherwise, search in tmpl_context
        :param id:
        :return:
        """
        return getattr(tmpl_context, cls.current_item_id_key_in_context(), '')

    def back_with_error(self, message):
        flash(message)
        redirect(request.headers['Referer'])

def current_user():
    return request.environ.get('repoze.who.identity')['user']


class Logger(object):
    TPL = '[{cls}] {msg}'
    def __init__(self, logger_name):
        self._name = logger_name
        self._logger = logging.getLogger(self._name)

    def _txt(self, instance_or_class):
        if instance_or_class.__class__.__name__ in ('function', 'type'):
            return instance_or_class.__name__
        else:
            return instance_or_class.__class__.__name__

    def debug(self, instance_or_class, message):
        self._logger.debug(Logger.TPL.format(cls=self._txt(instance_or_class), msg=message))

    def error(self, instance_or_class, message):
        self._logger.error(Logger.TPL.format(cls=self._txt(instance_or_class), msg=message))

    def info(self, instance_or_class, message):
        self._logger.info(Logger.TPL.format(cls=self._txt(instance_or_class), msg=message))

    def warning(self, instance_or_class, message):
        self._logger.warning(Logger.TPL.format(cls=self._txt(instance_or_class), msg=message))

logger = Logger('tracim')