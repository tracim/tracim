import typing
from tracim.lib.jitsi_meet.token import JitsiMeetToken
from tracim.lib.jitsi_meet.token import JitsiMeetUser
from tracim.lib.jitsi_meet.token import JitsiMeetContext
from tracim.lib.utils import str_as_alpha_num_str
from tracim.config.app_cfg import CFG
from tracim.model.data import Workspace
from tracim.model.data import User
import uuid


class JitsiMeetRoom(object):
    def __init__(
            self,
            receivers: Workspace,
            issuer: typing.Union[User, JitsiMeetUser, None]=None,
    ) -> None:
        """
        :param issuer: user who initiated Jitsi Meet talk
        if None, default user is created. Can be both Tracim User or
        JitsiMeetUser.
        :param receivers: User or Room who can talk with sender. Now, only
        Workspace are supported.
        """
        self.tracim_cfg = CFG.get_instance()
        self._set_domain()
        self._set_token_params()
        self._set_context(
            receivers=receivers,
            issuer=issuer,
        )
        self.room = self._generate_room_name(receivers)

    def _set_domain(self) -> None:
        """
        Set domain according to config
        :return:
        """
        self.domain = self.tracim_cfg.JITSI_MEET_DOMAIN

    def _set_token_params(self) -> None:
        """
        Set params related to token according to config.
        :return: nothing
        """
        self.use_token = self.tracim_cfg.JITSI_MEET_USE_TOKEN
        if self.use_token:
            if self.tracim_cfg.JITSI_MEET_TOKEN_GENERATOR == 'local':
                self.token_app_id = self.tracim_cfg.JITSI_MEET_TOKEN_GENERATOR_LOCAL_APP_ID  # nopep8
                self.token_secret = self.tracim_cfg.JITSI_MEET_TOKEN_GENERATOR_LOCAL_SECRET  # nopep8
                self.token_alg = self.tracim_cfg.JITSI_MEET_TOKEN_GENERATOR_LOCAL_ALG   # nopep8
                self.token_duration = self.tracim_cfg.JITSI_MEET_TOKEN_GENERATOR_LOCAL_DURATION  # nopep8
            else:
                raise JitsiMeetNoTokenGenerator

    def _set_context(
            self,
            receivers: Workspace,
            issuer: typing.Union[User, JitsiMeetUser, None],
    ) -> None:
        """
        Set context of JWT token for Jitsi Meet
        :param issuer: user who initiated Jitsi Meet talk
        if None, default user is created. Can be both Tracim User or
        JitsiMeetUser.
        :param receivers: User or Room who can talk with sender. Now, only
        Workspace are supported.
        :return: nothing.
        """

        # INFO - G.M - 13-02-2018 - Convert all issuers values as JitsiMeetUser
        if isinstance(issuer, JitsiMeetUser):
            user = issuer
        elif isinstance(issuer, User):
            user = JitsiMeetUser(
                name=issuer.display_name,
                avatar_url=None,
                jitsi_meet_user_id=issuer.display_name,
            )
        else:
            user = JitsiMeetUser(
                # INFO - G.M - 13-02-2018 - create unique id for anonymous user
                jitsi_meet_user_id=str(uuid.uuid4()),
            )

        # INFO - G.M - 13-02-2018 - Associate
        group = receivers.label

        self.context = JitsiMeetContext(
            user=user,
            group=group,
        )

    def _generate_room_name(self, workspace: Workspace) -> str:
        """
        Generate Jitsi-Meet room name related to workspace
        that should be unique, always the same for same workspace in same Tracim
        instance but should also no contains any special characters
        :param workspace: Tracim Workspace
        :return: room name as str.
        """
        room = "{uuid}{workspace_id}{workspace_label}".format(
            uuid=self.tracim_cfg.TRACIM_INSTANCE_UUID,
            workspace_id=workspace.workspace_id,
            workspace_label=workspace.label)

        # Jitsi-Meet doesn't like specials_characters
        return str_as_alpha_num_str(room)

    def generate_token(self) -> str:
        """
        Generate Jitsi-Meet related JWT token
        :return: JWT token as str
        """
        if not self.use_token:
            raise JitsiMeetTokenNotActivated

        token = JitsiMeetToken(
            domain=self.domain,
            room=self.room,
            app_id=self.token_app_id,
            secret=self.token_secret,
            alg=self.token_alg,
            duration=self.token_duration,
            context=self.context,
        )
        return token.generate()

    def generate_url(self, token=None) -> str:
        """
        Generate Jitsi-Meet url with or without token
        :return: url as string
        """
        if token:
            url = "{}/{}?jwt={}".format(self.domain,
                                        self.room,
                                        token)
        else:
            url = "{}/{}".format(self.domain,
                                 self.room,
                                 )
        return "https://{}".format(url)


class JitsiMeetNoTokenGenerator(Exception):
    pass


class JitsiMeetTokenNotActivated(Exception):
    pass
