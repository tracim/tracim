import datetime
import typing

import jwt


class JitsiTokenConfig(object):

    def __init__(self,
                 app_id: str,
                 secret: str,
                 alg: str,
                 duration: int,
                 )-> None:
        """
        JWT token generator config for JitsiMeet,
        :param app_id: application identifier
        :param secret: secret share between token generator and XMPP server
        :param alg: algorithm used
        :param duration: duration of token
        """
        self.app_id = app_id
        self.secret = secret
        self.alg = alg
        self.duration = duration


class JitsiMeetRoom(object):

    def __init__(self,
                 domain: str,
                 room: str,
                 token_config: typing.Optional[JitsiTokenConfig],
                 ) -> None:
        """
        JitsiMeet room Parameters
        :param domain: jitsi-meet domain
        :param room: room name
        :param token_config: token config, None if token not used.
        """
        self.domain = domain
        self.room = room
        self.token_config = token_config

    def generate_token(self) -> str:
        """
        Create jwt token according to room name and config
        see https://github.com/jitsi/lib-jitsi-meet/blob/master/doc/tokens.md
        :return: jwt encoded token as string
        """
        assert self.token_config
        now = datetime.datetime.utcnow()
        exp = now+datetime.timedelta(seconds=self.token_config.duration)
        data = {
            "iss": self.token_config.app_id,  # Issuer
            "room": self.room,  # Custom-param for jitsi_meet
            "aud": "*",  # TODO: Understood this param
            "exp": exp,  # Expiration date
            "nbf": now,  # NotBefore
            "iat": now,   # IssuedAt
        }
        jwt_token = jwt.encode(data,
                               self.token_config.secret,
                               algorithm=self.token_config.alg)
        return jwt_token.decode("utf-8")

    def generate_url(self) -> str:
        """
        Generate url with or without token
        :return: url as string
        """
        if self.token_config:
            token = self.generate_token()
            url = "{}/{}?jwt={}".format(self.domain,
                                        self.room,
                                        token,)
        else:
            url = "{}/{}".format(self.domain,
                                 self.room,)
        return "https://{}".format(url)
