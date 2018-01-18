import datetime

import jwt
from nose.tools import raises

from tracim.lib.jitsi_meet.jitsi_meet import JitsiTokenConfig
from tracim.lib.jitsi_meet.jitsi_meet import JitsiMeetRoom
from tracim.lib.jitsi_meet.jitsi_meet import NoTokenConfigError


class TestJitsiMeetRoom(object):

    TOKEN_CONFIG = JitsiTokenConfig(
        app_id='test',
        secret='secret',
        alg='HS256',
        duration=60,
    )
    ROOM = 'room'
    DOMAIN = 'tracim'

    def test_unit__generate_token(self) -> None:

        jmr = JitsiMeetRoom(
            domain=self.DOMAIN,
            room=self.ROOM,
            token_config=self.TOKEN_CONFIG,
        )
        str_token = jmr.generate_token()
        decoded_token = jwt.decode(str_token,
                                   key=self.TOKEN_CONFIG.secret,
                                   algorithm=self.TOKEN_CONFIG.alg,
                                   audience='*',
                                   issuer=self.TOKEN_CONFIG.app_id,
                                   )
        assert decoded_token.get('room') == self.ROOM
        assert decoded_token.get('iat')
        assert decoded_token.get('iat') == decoded_token.get('nbf')
        assert decoded_token.get('exp') == decoded_token.get('iat') + self.TOKEN_CONFIG.duration  # nopep8

    @raises(NoTokenConfigError)
    def test_unit__generate_token__no_token(self) -> None:
        jmr = JitsiMeetRoom(
            domain=self.DOMAIN,
            room=self.ROOM,
            token_config=None,
        )
        jmr.generate_token()

    def test_unit__generate_url_token(self) -> None:
        jmr = JitsiMeetRoom(
            domain=self.DOMAIN,
            room=self.ROOM,
            token_config=self.TOKEN_CONFIG,
        )

        def generate_token():
            return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyNzA3NzksImlzcyI6InRlc3QiLCJhdWQiOiIqIiwibmJmIjoxNTE2MjcwNzE5LCJyb29tIjoicm9vbSIsImlhdCI6MTUxNjI3MDcxOX0.zqFBUcPGjlCfXTjuFP7brqalY8TKlgcg6DUE72KhCx0'  # nopep8

        jmr.generate_token = generate_token
        url = jmr.generate_url()
        assert url == 'https://{domain}/{room}?jwt={token}'.format(
            domain=self.DOMAIN,
            room=self.ROOM,
            token=generate_token()
        )

    def test_unit__generate_url_no_token(self) -> None:
        jmr = JitsiMeetRoom(
            domain=self.DOMAIN,
            room=self.ROOM,
            token_config=None,
        )
        url = jmr.generate_url()
        assert url == 'https://{domain}/{room}'.format(
            domain=self.DOMAIN,
            room=self.ROOM,
        )
