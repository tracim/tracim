import uuid

from tracim_backend.models.data import Content

from .config import config

MENTION_NODE_NAME = 'span'
MENTION_ID_PREFIX = 'mention-'
MENTION_CLASS = 'mention'


def wrap_in_mention_node(username: str):
    """
        Wrap the username in a mention node to create a mention in Tracim.
        Subject to change if the way mentions are handled changes.

    :param username: The username you want to wrap in a mention node,
    """

    if username == "":
        return ""
    return f'<{MENTION_NODE_NAME} id="{MENTION_ID_PREFIX}{uuid.uuid4()}" ' + \
        f'class="{MENTION_CLASS}">@{username}</{MENTION_NODE_NAME}>'


def is_content_supported(content: Content):
    return content.type in config["ok_content_types"]


def is_content_whitelisted(content: Content):
    mimetype = content.file_mimetype.lower()
    extension = content.file_extension.lower()

    """
        The mimetype check is not working here, since the `content.file_mime_type` is not set.
        I kept it in case I'm using the wrong attribute.
    """

    return extension in config["ok_extensions"] or mimetype in config["ok_mimetypes"]


def is_content_blacklisted(content: Content):
    mimetype = content.file_mimetype.lower()
    extension = content.file_extension.lower()

    """
        The mimetype check is not working here, since the `content.file_mime_type` is not set.
        I kept it in case I'm using the wrong attribute.
    """

    return mimetype.startswith("video") or extension in config["nok_extensions"]
