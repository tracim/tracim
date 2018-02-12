import jwt
from tracim.lib.jitsi_meet.token import JitsiMeetToken
from tracim.lib.jitsi_meet.token import JitsiMeetContext
from tracim.lib.jitsi_meet.token import JitsiMeetUser


class TestJitsiMeetToken(object):

    TOKEN_APP_ID = 'test'
    TOKEN_SECRET = 'secret'
    TOKEN_ALG = 'HS256'
    TOKEN_DURATION = 60
    TOKEN_USER = JitsiMeetUser(name='john', email='john@doe', jitsi_meet_user_id='0')
    TOKEN_CONTEXT = JitsiMeetContext(user=TOKEN_USER, group='test')
    ROOM = 'room'
    DOMAIN = 'tracim'

    def test_unit__generate_token(self) -> None:

        token = JitsiMeetToken(
            domain=self.DOMAIN,
            room=self.ROOM,
            app_id=self.TOKEN_APP_ID,
            secret=self.TOKEN_SECRET,
            alg=self.TOKEN_ALG,
            duration=self.TOKEN_DURATION,
            context=self.TOKEN_CONTEXT,
        )
        str_token = token.generate()
        decoded_token = jwt.decode(str_token,
                                   key=self.TOKEN_SECRET,
                                   algorithm=self.TOKEN_ALG,
                                   audience='*',
                                   issuer=self.TOKEN_APP_ID,
                                   )
        assert decoded_token.get('room') == self.ROOM
        assert decoded_token.get('iat')
        assert decoded_token.get('iat') == decoded_token.get('nbf')
        assert decoded_token.get('exp') == decoded_token.get('iat') + self.TOKEN_DURATION  # nopep8
