import typing
import tg
from tg import abort
from tg import expose
from tg import tmpl_context
from tg.predicates import not_anonymous
from tracim.lib.predicates import current_user_is_reader
from sqlalchemy.orm.exc import NoResultFound

from tracim.lib.jitsi_meet.room import JitsiMeetRoom
from tracim.lib.jitsi_meet.token import JitsiMeetUser
from tracim.config.app_cfg import CFG

from tracim.model.data import User
from tracim.model.serializers import Context, CTX, DictLikeClass
from tracim.controllers import TIMRestController, TIMRestPathContextSetup

class JitsiMeetController(TIMRestController):

    allow_only = not_anonymous()

    def _before(self, *args, **kw):
        TIMRestPathContextSetup.current_user()
        try:
            TIMRestPathContextSetup.current_workspace()
        except NoResultFound:
            abort(404)

    @tg.require(current_user_is_reader())
    @expose('tracim.templates.videoconf.jitsi_meet')
    def get(self):
        user = tmpl_context.current_user
        return self._jitsi_room(jitsi_user=user)

    @tg.require(current_user_is_reader())
    @expose('tracim.templates.videoconf.invite')
    def invite(self):
        return self._jitsi_room()

    @classmethod
    def _jitsi_room(
            cls,
            jitsi_user: typing.Union[JitsiMeetUser, User, None]=None,
    ):
        cfg = CFG.get_instance()
        if not cfg.JITSI_MEET_ACTIVATED:
            abort(404)
        user = tmpl_context.current_user
        workspace = tmpl_context.workspace
        current_user_content = Context(CTX.CURRENT_USER).toDict(user)
        fake_api = Context(CTX.CURRENT_USER).toDict(
            {'current_user': current_user_content,
             }
        )
        dictified_workspace = Context(CTX.WORKSPACE).toDict(workspace,
                                                            'workspace')

        jitsi_meet_room = JitsiMeetRoom(
            issuer=jitsi_user,
            receivers=workspace,
        )

        return DictLikeClass(fake_api=fake_api,
                             result=dictified_workspace,
                             jitsi_meet_room=jitsi_meet_room)
