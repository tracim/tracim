import tg
from tg import request
from tg import Response
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
        cfg = CFG.get_instance()

        try:
            json = request.json_body
        except ValueError:
            return Response(
                status=400,
                json_body={'msg': 'Bad json'},
            )

        if json.get('token', None) != cfg.EMAIL_REPLY_TOKEN:
            # TODO - G.M - 2017-11-23 - Switch to status 403 ?
            # 403 is a better status code in this case.
            # 403 status response can't now return clean json, because they are
            # handled somewhere else to return html.
            return Response(
                status=400,
                json_body={'msg': 'Invalid token'}
            )

        if 'user_mail' not in json:
            return Response(
                status=400,
                json_body={'msg': 'Bad json: user_mail is required'}
            )

        if 'content_id' not in json:
            return Response(
                status=400,
                json_body={'msg': 'Bad json: content_id is required'}
            )

        if 'payload' not in json:
            return Response(
                status=400,
                json_body={'msg': 'Bad json: payload is required'}
            )

        uapi = UserApi(None)
        try:
            user = uapi.get_one_by_email(json['user_mail'])
        except NoResultFound:
            return Response(
                status=400,
                json_body={'msg': 'Unknown user email'},
            )
        api = ContentApi(user)

        try:
            thread = api.get_one(json['content_id'],
                                 content_type=ContentType.Any)
        except NoResultFound:
            return Response(
                status=400,
                json_body={'msg': 'Unknown content_id'},
            )

        # INFO - G.M - 2017-11-17
        # When content_id is a sub-elem of a main content like Comment,
        # Attach the thread to the main content.
        if thread.type == ContentType.Comment:
            thread = thread.parent
        if thread.type == ContentType.Folder:
            return Response(
                status=400,
                json_body={'msg': 'comment for folder not allowed'},
            )
        if 'content' in json['payload']:
            api.create_comment(
                workspace=thread.workspace,
                parent=thread,
                content=json['payload']['content'],
                do_save=True,
            )
            return Response(
                status=204,
            )
        else:
            return Response(
                status=400,
                json_body={'msg': 'No content to add new comment'},
            )
