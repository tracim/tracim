import datetime
import typing

import jwt

JITSI_URL = "https://prosody"
JWT_APP_ID = "test"
JWT_SECRET = "secret"
JWT_ALG = 'HS256'
JWT_DURATION = 60*1  # duration in second
JITSI_USE_TOKEN = True


class JitsiTokenConfig:

    def __init__(self,
                 app_id: str,
                 secret: str,
                 alg: str,
                 duration: int,
                 )-> None:
        self.app_id = app_id
        self.secret = secret
        self.alg = alg
        self.duration = duration


class JitsiMeetRoomHandler:

    def __init__(self,
                 base_url: str,
                 token_config: typing.Optional[JitsiTokenConfig],
                 ) -> None:
        self.base_url = base_url
        self.token_config = token_config

    def generate_token(self, room: str)->str:
        """
        Create jwt token according to room name and config
        :param room: room name
        :return: jwt encoded token as string
        """
        assert self.token_config
        now = datetime.datetime.utcnow()
        exp = now+datetime.timedelta(seconds=self.token_config.duration)
        data = {
            "iss": self.token_config.app_id,  # Issuer
            "room": room,  # Custom-param for jitsi_meet
            "aud": "*",  # TODO: Understood this param
            "exp": exp,  # Expiration date
            "nbf": now,  # NotBefore
            "iat": now,   # IssuedAt
        }
        jwt_token = jwt.encode(data,
                               self.token_config.secret,
                               algorithm=self.token_config.alg)
        return jwt_token.decode("utf-8")

    def generate_url(self, room: str)->str:
        """
        Generate url with or without token
        :param room: room name
        :return: url as string
        """
        if self.token_config:
            token = self.generate_token(room)
            url = "{}/{}?jwt={}".format(JITSI_URL,
                                        room,
                                        token,)
        else:
            url = "{}/{}".format(JITSI_URL,
                                 room,)
        return url

if JITSI_USE_TOKEN:
    defaultTokenConfig = JitsiTokenConfig(
        app_id=JWT_APP_ID,
        secret=JWT_SECRET,
        alg=JWT_ALG,
        duration=JWT_DURATION,
    )
else:
    defaultTokenConfig = None

JitsiMeetRoom = JitsiMeetRoomHandler(
    base_url=JITSI_URL,
    token_config= defaultTokenConfig
)

if __name__ == '__main__' :
    print(JitsiMeetRoom.generate_url('test'))