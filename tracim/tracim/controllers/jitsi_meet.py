import tg
from tg import abort
from tg import expose
from tg import tmpl_context
from tg.predicates import not_anonymous
from tracim.lib.predicates import current_user_is_reader
from sqlalchemy.orm.exc import NoResultFound

from tracim.lib.utils import str_as_alpha_num_str
from tracim.lib.jitsi_meet.jitsi_meet import JitsiMeetRoom
from tracim.lib.jitsi_meet.jitsi_meet import JitsiTokenConfig
from tracim.config.app_cfg import CFG

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

        # TODO - G.M - 18-01-2017 -
        # allow to set specific room name from workspace object ?
        room = "{uuid}{workspace_id}{workspace_label}".format(
            uuid=cfg.TRACIM_INSTANCE_UUID,
            workspace_id=workspace.workspace_id,
            workspace_label=workspace.label)

        # Jitsi-Meet doesn't like specials_characters
        room = str_as_alpha_num_str(room)

        token = None
        if cfg.JITSI_MEET_USE_TOKEN:
            if cfg.JITSI_MEET_TOKEN_GENERATOR == 'local':
                token = JitsiTokenConfig(
                    app_id=cfg.JITSI_MEET_TOKEN_GENERATOR_LOCAL_APP_ID,
                    secret=cfg.JITSI_MEET_TOKEN_GENERATOR_LOCAL_SECRET,
                    alg=cfg.JITSI_MEET_TOKEN_GENERATOR_LOCAL_ALG,
                    duration=cfg.JITSI_MEET_TOKEN_GENERATOR_LOCAL_DURATION,
                )
            else:
                abort(400)

        jitsi_meet_room = JitsiMeetRoom(
            room=room,
            domain=cfg.JITSI_MEET_DOMAIN,
            token_config=token)

        return DictLikeClass(fake_api=fake_api,
                             result=dictified_workspace,
                             jitsi_meet_room=jitsi_meet_room)
