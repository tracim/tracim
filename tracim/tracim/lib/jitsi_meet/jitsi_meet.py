import jwt
import json
import datetime
import time

JITSI_URL="https://prosody"
JWT_APP_ID="test"
JWT_SECRET="secret"
JWT_ALG='HS256'
JWT_DURATION=60*1 # duration in second
JITSI_USE_TOKEN=True



def _generate_token(room:str)->str:
    '''
    Create jwt token according to room name and config
    :param room: room name
    :return: jwt encoded token as string
    '''
    now = datetime.datetime.utcnow()
    exp = now+datetime.timedelta(seconds=JWT_DURATION)
    data = {
        "iss":JWT_APP_ID, #Issuer
        "room": room, # Custom-param for jitsi_meet
        "aud": "*", # TODO: Understood this param
        "exp": exp, # Expiration date
        "nbf": now, # NotBefore
        "iat": now  # IssuedAt
    }
    jwt
    jwttoken= jwt.encode(data,
                        JWT_SECRET,
                        algorithm=JWT_ALG)
    return jwttoken.decode("utf-8")

def _generate_url(room:str)->str:
    '''
    Generate url with or without token
    :param room: room name
    :return: url as string
    '''
    if JITSI_USE_TOKEN:
        token=_generate_token(room)
        url="{}/{}?jwt={}".format(JITSI_URL,
                              room
                              ,token)
    else:
        url="{}/{}".format(JITSI_URL,
                           room)
    return url


print(_generate_url("test"))