import jwt
import datetime
import calendar

from tracim.lib.jitsi_meet.token import JitsiMeetToken
from tracim.lib.jitsi_meet.token import JitsiMeetContext
from tracim.lib.jitsi_meet.token import JitsiMeetUser


class TestJitsiMeetToken(object):

    TOKEN_APP_ID = 'test'
    TOKEN_SECRET = 'secret'
    TOKEN_ALG = 'HS256'
    TOKEN_DURATION = 60
    TOKEN_USER = JitsiMeetUser(name='john',
                               email='john@doe',
                               jitsi_meet_user_id='0')
    TOKEN_CONTEXT = JitsiMeetContext(user=TOKEN_USER, group='test')
    ROOM = 'room'
    DOMAIN = 'tracim'
    ISSUE_DATE = datetime.datetime.utcfromtimestamp(0)

    def test_unit__generate_token_check_value(self) -> None:
        """
        Test all value without checking jwt validity (timestamp 0 as issue date)
        :return: Nothing
        """

        token = JitsiMeetToken(
            domain=self.DOMAIN,
            room=self.ROOM,
            app_id=self.TOKEN_APP_ID,
            secret=self.TOKEN_SECRET,
            alg=self.TOKEN_ALG,
            duration=self.TOKEN_DURATION,
            context=self.TOKEN_CONTEXT,
        )

        str_token = token.generate(issue_date=self.ISSUE_DATE)
        decoded_token = jwt.decode(str_token,
                                   key=self.TOKEN_SECRET,
                                   algorithm=self.TOKEN_ALG,
                                   audience='*',
                                   issuer=self.TOKEN_APP_ID,
                                   verify=False
                                   )

        assert decoded_token.get('iss') == self.TOKEN_APP_ID
        assert decoded_token.get('room') == self.ROOM
        assert decoded_token.get('aud') == "*"
        assert decoded_token.get('context')
        assert decoded_token['context'].get('user')
        assert decoded_token['context']['user'].get('name') == 'john'
        assert decoded_token['context']['user'].get('email') == 'john@doe'
        assert decoded_token['context']['user'].get('id') == '0'
        assert decoded_token['context'].get('group') == 'test'
        assert decoded_token.get('iat') == calendar.timegm(
            self.ISSUE_DATE.utctimetuple()
        )
        assert decoded_token.get('iat') == decoded_token.get('nbf')
        assert decoded_token.get('exp') == decoded_token.get('iat') + self.TOKEN_DURATION  # nopep8

    def test_unit__generate_token_check_jwt(self) -> None:
        """
        Test only JWT validity and time params with default issue date
        :return: Nothing
        """
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

        assert decoded_token.get('iat') == decoded_token.get('nbf')
        assert decoded_token.get('exp') == decoded_token.get('iat') + self.TOKEN_DURATION  # nopep8


class TestJitsiMeetUser(object):

    def test_unit__as_dict(self):

        user1 = JitsiMeetUser(jitsi_meet_user_id='1')
        assert user1.as_dict() == {'id': '1'}

        user2 = JitsiMeetUser(jitsi_meet_user_id='2', name='john')
        assert user2.as_dict() == {'id': '2', 'name': 'john'}

        user3 = JitsiMeetUser(jitsi_meet_user_id='3', name='john', email='a@b')
        assert user3.as_dict() == {'id': '3', 'name': 'john', 'email': 'a@b'}

        user4 = JitsiMeetUser(
            jitsi_meet_user_id='4',
            name='john',
            email='a@b',
            avatar_url='http://mysuperavatar/avatar.png'
        )
        assert user4.as_dict() == {
            'id': '4',
            'name': 'john',
            'email': 'a@b',
            'avatar': 'http://mysuperavatar/avatar.png',
        }

        user5 = JitsiMeetUser(
            jitsi_meet_user_id='5',
            name='john',
            avatar_url='http://mysuperavatar/avatar.png'
        )
        assert user5.as_dict() == {
            'id': '5',
            'name': 'john',
            'avatar': 'http://mysuperavatar/avatar.png',
        }

        user6 = JitsiMeetUser(
            jitsi_meet_user_id='6',
            email='a@b',
            avatar_url='http://mysuperavatar/avatar.png'
        )
        assert user6.as_dict() == {
            'id': '6',
            'email': 'a@b',
            'avatar': 'http://mysuperavatar/avatar.png',
        }

        user7 = JitsiMeetUser(
            jitsi_meet_user_id='7',
            email='a@b',
        )
        assert user7.as_dict() == {
            'id': '7',
            'email': 'a@b',
        }

        user8 = JitsiMeetUser(
            jitsi_meet_user_id='8',
            avatar_url='http://mysuperavatar/avatar.png'
        )
        assert user8.as_dict() == {
            'id': '8',
            'avatar': 'http://mysuperavatar/avatar.png',
        }


class TestJitsiMeetContext(object):

    def test_unit__as_dict(self):

        context = JitsiMeetContext()
        assert context.as_dict() == {
            'group': 'default'
        }

        context = JitsiMeetContext(group='group1')
        assert context.as_dict() == {
            'group': 'group1'
        }

        user = JitsiMeetUser(jitsi_meet_user_id='user')
        context = JitsiMeetContext(group='group1', user=user)
        assert context.as_dict() == {
            'group': 'group1',
            'user': user.as_dict()
        }

        callee = JitsiMeetUser(jitsi_meet_user_id='callee')
        context = JitsiMeetContext(group='group1', user=user, callee=callee)
        assert context.as_dict() == {
            'group': 'group1',
            'user': user.as_dict(),
            'callee': callee.as_dict()
        }
