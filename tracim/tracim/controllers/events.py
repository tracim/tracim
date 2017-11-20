import tg
from tg import request
from tg import RestController
from sqlalchemy.orm.exc import NoResultFound

from tracim.lib.content import ContentApi
from tracim.lib.user import UserApi
from tracim.model.data import ContentType

class EventsRestController(RestController):


    @tg.expose('json')
    def post(self):
        json = request.json_body

        from tracim.config.app_cfg import CFG
        cfg = CFG.get_instance()

        if 'token' in json and json['token'] == cfg.EMAIL_REPLY_TOKEN:
            if 'user_mail' not in json or 'content_id' not in json:
                return {'status': 'error',
                        'error': 'bad json',}
            uapi = UserApi(None)
            # TODO support Empty result error
            try:
                user = uapi.get_one_by_email(json['user_mail'])
            except NoResultFound :
                return {'status': 'error',
                        'error': 'bad user mail',}
            api = ContentApi(user)

            try:
                thread = api.get_one(json['content_id'],
                                     content_type=ContentType.Any)
            except NoResultFound :
                return {'status': 'error',
                        'error': 'bad content id',}
            # INFO - G.M - 2017-11-17
            # When content_id is a sub-elem of a main content like Comment,
            # Attach the thread to the main content.
            if thread.type == ContentType.Comment:
                thread = thread.parent
            if thread.type == ContentType.Folder:
                return {'status': 'error',
                        'error': 'comment for folder not allowed',}
            api.create_comment(thread.workspace, thread,
                               json['payload']['content'], True)
            return {'status': 'ok',}
        else:
            return {'status': 'error',
                    'error': 'invalid token',}
