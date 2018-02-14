import datetime
import typing
import jwt

# Jitsi Meet Token
# Data model and methods to convert dict as JWT token
# see https://github.com/jitsi/lib-jitsi-meet/blob/52eb3decf6542413c739ce2209456fac728a89d5/doc/tokens.md  # nopep8


class JitsiMeetUser(object):

    def __init__(
            self,
            jitsi_meet_user_id: str,
            name: typing.Optional[str] = None,
            email: typing.Optional[str] = None,
            avatar_url: typing.Optional[str] = None,
    ) -> None:
        """
        User data for Jitsi-Meet token
        :param avatar_url: url for user avatar_url
        :param name: display name of user
        :param email: email of user
        :param jitsi_meet_user_id: Jitsi-Meet id of user
        """
        self.avatar_url = avatar_url
        self.name = name
        self.email = email
        self.jitsi_meet_user_id = jitsi_meet_user_id

    def as_dict(self) -> dict:
        """
        Generate dict for JWT token
        :return: user as dict
        """
        data = {
            'id': self.jitsi_meet_user_id,
        }
        if self.name:
            data['name'] = self.name
        if self.email:
            data['email'] = self.email
        if self.avatar_url:
            data['avatar'] = self.avatar_url
        return data


class JitsiMeetContext(object):

    def __init__(
            self,
            user: typing.Optional[JitsiMeetUser]=None,
            callee: typing.Optional[JitsiMeetUser]=None,
            group: str="default",
    ) -> None:
        """
        context as in Jitsi-Meet Token
        :param user: Current user
        :param callee: User Who respond in 1-to-1 conf
        :param group: Used only for stats
        """
        self.user = user
        self.callee = callee
        self.group = group

    def as_dict(self) -> dict:
        """
        Generate dict for JWT token
        :return: context as dict
        """
        data = {}
        if self.callee:
            data['callee'] = self.callee.as_dict()
        if self.user:
            data['user'] = self.user.as_dict()
        if self.group:
            data['group'] = self.group
        return data


class JitsiMeetToken(object):

    def __init__(
            self,
            domain: str,
            room: str,
            app_id: str,
            secret: str,
            alg: str,
            duration: int,
            context: typing.Optional[JitsiMeetContext] = None,
    ) -> None:
        """
        JWT token generator for Jitsi-Meet,
        :param app_id: application identifier
        :param secret: secret share between token generator and XMPP server
        :param alg: algorithm used
        :param duration: duration of token
        :param domain: Jitsi-Meet domain
        :param room: room name
        """
        self.room = room
        self.domain = domain
        self.app_id = app_id
        self.secret = secret
        self.alg = alg
        self.duration = duration
        self.context = context

    def generate(self) -> str:
        """
        Generate JWT token
        :return: JWT token as str
        """
        now = datetime.datetime.utcnow()
        exp = now+datetime.timedelta(seconds=self.duration)
        data = {
            "iss": self.app_id,  # Issuer
            "room": self.room,  # Custom-param for jitsi_meet
            "aud": "*",  # TODO: Understood this param
            "exp": exp,  # Expiration date
            "nbf": now,  # NotBefore
            "iat": now,   # IssuedAt
        }
        if self.context:
            data['context'] = self.context.as_dict()
        jwt_token = jwt.encode(
            data,
            self.secret,
            algorithm=self.alg
        )
        return jwt_token.decode("utf-8")
