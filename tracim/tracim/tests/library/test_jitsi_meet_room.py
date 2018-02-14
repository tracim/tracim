from tracim.lib.jitsi_meet.room import JitsiMeetRoom
from tracim.lib.jitsi_meet.room import JitsiMeetTokenNotActivated
from tracim.lib.jitsi_meet.room import JitsiMeetNoTokenGenerator
from tracim.lib.jitsi_meet.token import JitsiMeetUser
from tracim.model.data import User
from tracim.model.data import Workspace
from nose.tools import raises
from mock import patch, Mock


class TestJitsiMeetRoom(object):

    ROOM = 'room'
    DOMAIN = 'tracim'
    TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyNzA3NzksImlzcyI6InRlc3QiLCJhdWQiOiIqIiwibmJmIjoxNTE2MjcwNzE5LCJyb29tIjoicm9vbSIsImlhdCI6MTUxNjI3MDcxOX0.zqFBUcPGjlCfXTjuFP7brqalY8TKlgcg6DUE72KhCx0'  # nopep8

    def test_unit__generate_url_token_no_token(self) -> None:
        with patch.object(JitsiMeetRoom,
                          "__init__",
                          lambda item, receivers: None):
            jmr = JitsiMeetRoom(
                receivers=Workspace()
            )
            jmr.domain = TestJitsiMeetRoom.DOMAIN
            jmr.room = TestJitsiMeetRoom.ROOM
            url = jmr.generate_url()
            assert url == 'https://{domain}/{room}'.format(
                domain=self.DOMAIN,
                room=self.ROOM,
                token=self.TOKEN
            )

    def test_unit__generate_url_token(self) -> None:
        with patch.object(JitsiMeetRoom,
                          "__init__",
                          lambda item, receivers: None):
            jmr = JitsiMeetRoom(
                receivers=Workspace()
            )
            jmr.domain = TestJitsiMeetRoom.DOMAIN
            jmr.room = TestJitsiMeetRoom.ROOM
            url = jmr.generate_url(token=self.TOKEN)
            assert url == 'https://{domain}/{room}?jwt={token}'.format(
                domain=self.DOMAIN,
                room=self.ROOM,
                token=self.TOKEN
            )

    @raises(JitsiMeetNoTokenGenerator)
    def test_unit__set_token_params_no_token_generator(self) -> None:
        with patch.object(JitsiMeetRoom,
                          "__init__",
                          lambda item, receivers: None):
            jmr = JitsiMeetRoom(
                receivers=Workspace()
            )
            jmr.tracim_cfg = Mock()
            jmr.tracim_cfg.JITSI_MEET_TOKEN_GENERATOR = None
            jmr._set_token_params()

    @raises(JitsiMeetTokenNotActivated)
    def test_unit__generate_token_not_activated(self) -> None:
        with patch.object(JitsiMeetRoom,
                          "__init__",
                          lambda item, receivers: None):
            jmr = JitsiMeetRoom(
                receivers=Workspace()
            )
            jmr.use_token = False
            jmr.generate_token()

    def test_unit__set_context_return_always_jitsi_meet_user(self):
        with patch.object(JitsiMeetRoom,
                          "__init__",
                          lambda item, receivers: None):
            jmr = JitsiMeetRoom(
                receivers=Workspace()
            )
            jmr._set_context(issuer=None, receivers=Workspace())
            assert jmr.context
            assert hasattr(jmr.context, 'user')
            assert isinstance(jmr.context.user, JitsiMeetUser)

            jmr2 = JitsiMeetRoom(
                receivers=Workspace()
            )
            jmr2._set_context(issuer=JitsiMeetUser(jitsi_meet_user_id='user'),
                              receivers=Workspace())
            assert jmr2.context
            assert hasattr(jmr2.context, 'user')
            assert isinstance(jmr2.context.user, JitsiMeetUser)

            jmr3 = JitsiMeetRoom(
                receivers=Workspace()
            )
            jmr3._set_context(issuer=User(), receivers=Workspace())
            assert jmr3.context
            assert hasattr(jmr3.context, 'user')
            assert isinstance(jmr3.context.user, JitsiMeetUser)

    def test_unit__generate_room_name(self):
        with patch.object(JitsiMeetRoom,
                          "__init__",
                          lambda item, receivers: None):
            jmr = JitsiMeetRoom(
                receivers=Workspace()
            )
            mock = Mock()
            jmr.tracim_cfg = Mock()
            jmr.tracim_cfg.TRACIM_INSTANCE_UUID = 'myuuid'
            mock.workspace_id = 1
            mock.label = 'myroom'
            assert jmr._generate_room_name(mock) == 'myuuid1myroom'

    def test_unit__generate_room_name_no_special_character(self):
        with patch.object(JitsiMeetRoom,
                          "__init__",
                          lambda item, receivers: None):
            jmr = JitsiMeetRoom(
                receivers=Workspace()
            )
            mock = Mock()
            jmr.tracim_cfg = Mock()
            # TODO - G.M - 14-02-2018 - Be exhaustive about special char ?
            jmr.tracim_cfg.TRACIM_INSTANCE_UUID = '*%hél\/ <>."{}|+&-@"~]=lo{à!ll;:'  # nopep8
            mock.workspace_id = 1
            mock.label = 'myroom'
            assert jmr._generate_room_name(mock) == 'helloall1myroom'
