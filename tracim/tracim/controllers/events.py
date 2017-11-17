import tg
from tg import request
from tg import RestController
from tracim.lib.content import ContentApi
from tracim.lib.user import UserApi
from tracim.model.data import ContentType

VALID_TOKEN_VALUE="djkflhqsfhyqsdb fq"

class EventsRestController(RestController):


    @tg.expose('json')
    def post(self):
        json = request.json_body
        if 'token' in json and json['token'] == VALID_TOKEN_VALUE:
            # TODO check json content
            uapi = UserApi(None)
            # TODO support Empty result error
            user = uapi.get_one_by_email(json['user_mail'])
            api = ContentApi(user)

            thread = api.get_one(json['content_id'],content_type=ContentType.Any)
            # INFO - G.M - 2017-11-17
            # When content_id is a sub-elem of a main content like Comment,
            # Attach the thread to the main content.
            if thread.type == ContentType.Comment:
                thread = thread.parent
            if thread.type == ContentType.Folder:
                return {'status': 'error',
                        'error': 'comment for folder not allowed'}
            api.create_comment(thread.workspace, thread,
                               json['payload']['content'], True)
        else:
            return {'status': 'error',
                    'error': 'invalid token'}
        return json
