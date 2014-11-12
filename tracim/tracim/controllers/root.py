# -*- coding: utf-8 -*-

from tg import expose
from tg import flash
from tg import lurl
from tg import predicates
from tg import redirect
from tg import request
from tg import require
from tg import tmpl_context
from tg import url

from tg.i18n import ugettext as _

from tracim.lib import CST
from tracim.lib.base import logger
from tracim.lib.user import UserStaticApi

from tracim.controllers import StandardController
from tracim.controllers.admin import AdminController
from tracim.controllers.debug import DebugController
from tracim.controllers.error import ErrorController
from tracim.controllers.help import HelpController
from tracim.controllers.user import UserRestController
from tracim.controllers.workspace import UserWorkspaceRestController

from tracim.model.serializers import DictLikeClass
from tracim.model.serializers import CTX
from tracim.model.serializers import Context


class RootController(StandardController):
    """
    The root controller for the tracim application.

    All the other controllers and WSGI applications should be mounted on this
    controller. For example::

        panel = ControlPanelController()
        another_app = AnotherWSGIApplication()

    Keep in mind that WSGI applications shouldn't be mounted directly: They
    must be wrapped around with :class:`tg.controllers.WSGIAppController`.
    """

    admin = AdminController()
    help = HelpController()

    debug = DebugController()
    error = ErrorController()

    # Rest controllers
    workspaces = UserWorkspaceRestController()
    user = UserRestController()

    def _before(self, *args, **kw):
        super(RootController, self)._before(args, kw)
        tmpl_context.project_name = "tracim"


    @expose('tracim.templates.index')
    def index(self, came_from='', *args, **kwargs):
        if request.identity:
            if came_from:
                logger.info(self, 'Will redirect to {}'.format(came_from))
                redirect(url(came_from))
            else:
                redirect(self.url(None, self.dashboard.__name__))

        login_counter = request.environ.get('repoze.who.logins', 0)
        if login_counter > 0:
            flash(_('Wrong credentials'), CST.STATUS_ERROR)
        return dict(page='login', login_counter=str(login_counter),
                    came_from=came_from)

    @require(predicates.is_anonymous())
    @expose('tracim.templates.index')
    def login(self, *args, **kwargs):
        """
        This method is there for backward compatibility only
        This is related to the default TG2 authentication behavior...
        Now the login form is included in home page
        :param args:
        :param kwargs:
        :return:
        """
        came_from = kwargs['came_from'] if 'came_from' in kwargs.keys() else ''
        logger.info(self, 'came_from: {}'.format(kwargs))
        return self.index(came_from, args, *kwargs)


    @expose()
    def post_login(self, came_from=lurl('/')):
        """
        Redirect the user to the initially requested page on successful
        authentication or redirect her back to the login page if login failed.
        """
        if not request.identity:
            login_counter = request.environ.get('repoze.who.logins', 0) + 1
            redirect(url('/login'),
                params=dict(came_from=came_from, __logins=login_counter))

        user = UserStaticApi.get_current_user()

        flash(_('Welcome back, %s!') % user.get_display_name())
        redirect(came_from)

    @expose()
    def post_logout(self, came_from=lurl('/')):
        """
        Redirect the user to the initially requested page on logout and say  goodbye as well.
        """
        flash(_('Successfully logged out. We hope to see you soon!'))
        redirect(came_from)
        

    @require(predicates.not_anonymous())
    @expose('tracim.templates.dashboard')
    def dashboard(self):
        user = tmpl_context.current_user

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        fake_api = Context(CTX.CURRENT_USER).toDict({'current_user': current_user_content})

        return DictLikeClass(fake_api=fake_api)
