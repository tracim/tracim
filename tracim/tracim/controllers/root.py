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

from tracim.controllers import StandardController
from tracim.controllers.admin import AdminController
from tracim.controllers.api import APIController
from tracim.controllers.calendar import CalendarConfigController
from tracim.controllers.calendar import CalendarController
from tracim.controllers.content import ContentController
from tracim.controllers.debug import DebugController
from tracim.controllers.error import ErrorController
from tracim.controllers.help import HelpController
from tracim.controllers.previews import PreviewsController
from tracim.controllers.user import UserRestController
from tracim.controllers.workspace import UserWorkspaceRestController
from tracim.lib import CST
from tracim.lib.base import logger
from tracim.lib.content import ContentApi
from tracim.lib.user import CurrentUserGetterApi
from tracim.lib.utils import replace_reset_password_templates
from tracim.model.data import ContentType
from tracim.model.serializers import Context
from tracim.model.serializers import CTX
from tracim.model.serializers import DictLikeClass


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
    calendar = CalendarController()
    calendar_config = CalendarConfigController()

    debug = DebugController()
    error = ErrorController()

    # Rest controllers
    workspaces = UserWorkspaceRestController()
    user = UserRestController()
    previews = PreviewsController()

    content = ContentController()

    # api
    api = APIController()

    def _render_response(self, tgl, controller, response):
        replace_reset_password_templates(controller.decoration.engines)
        return super()._render_response(tgl, controller, response)

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
                redirect(self.url(None, self.home.__name__))

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
    def post_login(self, came_from=lurl('/home')):
        """
        Redirect the user to the initially requested page on successful
        authentication or redirect her back to the login page if login failed.
        """
        if not request.identity:
            login_counter = request.environ.get('repoze.who.logins', 0) + 1
            redirect(url('/login'),
                     params=dict(came_from=came_from, __logins=login_counter))

        user = CurrentUserGetterApi.get_current_user()

        flash(_('Welcome back, %s!') % user.get_display_name())
        redirect(came_from)

    @expose()
    def post_logout(self, came_from=lurl('/')):
        """
        Redirect the user to the initially requested page on logout and say
        goodbye as well.
        """
        flash(_('Successfully logged out. We hope to see you soon!'))
        redirect(came_from)

    @require(predicates.not_anonymous())
    @expose('tracim.templates.home')
    def home(self):
        user = tmpl_context.current_user

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        fake_api = Context(CTX.CURRENT_USER).toDict({
            'current_user': current_user_content})

        last_active_contents = ContentApi(user).get_last_active(None, ContentType.Any, None)
        fake_api.last_actives = Context(CTX.CONTENT_LIST).toDict(last_active_contents, 'contents', 'nb')

        unread_contents = ContentApi(user).get_last_unread(None, ContentType.Any, None)
        fake_api.last_unread = Context(CTX.CONTENT_LIST).toDict(unread_contents, 'contents', 'nb')

        # INFO - D.A. - 2015-05-20
        # For now, we do not have favorties and read/unread status
        # so we only show:
        # - workspaces
        # - last activity
        # - oldest open stuff

        items = ContentApi(user).get_all_without_exception(ContentType.Any, None)[:4]
        fake_api.favorites = Context(CTX.CONTENT_LIST).toDict(items, 'contents', 'nb')
        return DictLikeClass(fake_api=fake_api)

        # user_id = tmpl_context.current_user.user_id
        #
        # current_user = tmpl_context.current_user
        # assert user_id==current_user.user_id
        # api = UserApi(current_user)
        # current_user = api.get_one(current_user.user_id)
        # dictified_user = Context(CTX.USER).toDict(current_user, 'user')
        # current_user_content = Context(CTX.CURRENT_USER).toDict(tmpl_context.current_user)
        # fake_api_content = DictLikeClass(current_user=current_user_content)
        # fake_api = Context(CTX.WORKSPACE).toDict(fake_api_content)
        #
        # return DictLikeClass(result = dictified_user, fake_api=fake_api)

    @require(predicates.not_anonymous())
    @expose('tracim.templates.search.display')
    def search(self, keywords=''):
        from tracim.lib.content import ContentApi

        user = tmpl_context.current_user
        api = ContentApi(user)

        items = []
        keyword_list = api.get_keywords(keywords)

        result = api.search(keyword_list)
        if result:
            items = result.limit(ContentApi.SEARCH_DEFAULT_RESULT_NB).all()
        api.exclude_unavailable(items)

        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        fake_api = Context(CTX.CURRENT_USER).toDict({'current_user': current_user_content})

        search_results = Context(CTX.SEARCH).toDict(items, 'results', 'result_nb')
        search_results.keywords = keyword_list

        return DictLikeClass(fake_api=fake_api, search=search_results)
