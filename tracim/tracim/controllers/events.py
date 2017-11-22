import tg
from tg import request
from tg import abort
from tg import RestController
from sqlalchemy.orm.exc import NoResultFound

from tracim.lib.content import ContentApi
from tracim.lib.user import UserApi
from tracim.model.data import ContentType
from tracim.config.app_cfg import CFG


class EventRestController(RestController):

    @tg.expose('json')
    def post(self):
        try:
            json = request.json_body
        except:
            abort(400,'Bad json')
        cfg = CFG.get_instance()
        if 'token' in json and json['token'] == cfg.EMAIL_REPLY_TOKEN:
            if 'user_mail' not in json:
                abort(400,'Bad sson : user_mail is required.')
            if 'content_id' not in json:
                abort(400, 'Bad json : content_id is required.')
            if  'payload' not in json:
                abort(400, 'Bad json : payload is required.')
            uapi = UserApi(None)
            try:
                user = uapi.get_one_by_email(json['user_mail'])
            except NoResultFound:
                abort(400,'Unknown user email.')
            api = ContentApi(user)

            try:
                thread = api.get_one(json['content_id'],
                                     content_type=ContentType.Any)
            except NoResultFound:
                abort(400,'Unknown content_id.')
            # INFO - G.M - 2017-11-17
            # When content_id is a sub-elem of a main content like Comment,
            # Attach the thread to the main content.
            if thread.type == ContentType.Comment:
                thread = thread.parent
            if thread.type == ContentType.Folder:
                abort(400,'comment for folder not allowed')

            if 'content' in json['payload']:
                api.create_comment(thread.workspace, thread,
                                   json['payload']['content'], True)
                abort(204)
            else:
                abort(400,'No content to add new comment')
        else:
            abort(403)
