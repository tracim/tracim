import abc
import typing
import uuid

from bs4 import BeautifulSoup
from bs4 import Tag
from pluggy import PluginManager

from tracim_backend.app_models.contents import COMMENT_TYPE
from tracim_backend.config import CFG
from tracim_backend.exceptions import UserNotMemberOfWorkspace
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.event import BaseLiveMessageBuilder
from tracim_backend.lib.core.event import EventApi
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.event import EntityType
from tracim_backend.models.event import Event
from tracim_backend.models.event import OperationType
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.models.tracim_session import TracimSession


class MentionType:
    USER = 1
    ROLE = 2
    GROUP = 3  # TODO - MP - 2022-11-29 - This should be used for custom role. Should be renamed.


class Mention:
    """A mention with its attributes: id and recipient."""

    def __init__(self, type: MentionType, recipient: int, id_: str) -> None:
        self.type = type
        self.recipient = recipient
        self.id = id_

    def __eq__(self, other) -> bool:
        return (
            isinstance(other, Mention)
            and self.type == other.type
            and other.recipient == self.recipient
            and other.id == self.id
        )

    def __repr__(self) -> str:
        return f"<Mention(type={self.type}, recipient={self.recipient}, id={self.id})>"

    def __hash__(self) -> int:
        return hash(self.id)


class BaseMentionParser(abc.ABC):
    """Base class for mention parsers."""

    @abc.abstractmethod
    def seek_and_replace_wrong_mention(self, text: str, session: TracimSession, config: CFG) -> str:
        """Seek and replace wrong mention in text.\n
        Replace username="john" by userid="1"

        Args:
            text (str): The text to parse.
            session (TracimSession): The session to use.
            config (CFG): The config to use.

        Returns:
            str: The text with replaced mention.
        """
        ...

    @abc.abstractmethod
    def get_mentions(self, revision: ContentRevisionRO) -> typing.List[Mention]:
        """Parse mentions found in the given content revision and return them.

        All revision mentions must be returned by this method, handling new mentions when
        content is modified is done in MentionBuilder.
        """
        ...


class DescriptionMentionParser(BaseMentionParser):
    """
    This class will parse the revision description field and return
    mentions found in it considering description is HTML.

    HTML mentions must have the following structure:
      `<html-mention id="mention-{a unique id}" {DATA}></html-mention>`

    DATA should be one of theses:
     - userid="{user_id}"
     - roleid="{role_id}"
    """

    MENTION_ID_START = "mention-"  # TODO - MP - 2022-11-29 - Check if this is still used
    MENTION_TAG_NAME = "html-mention"

    @classmethod
    def seek_and_replace_wrong_mention(self, text: str, session: TracimSession, config: CFG) -> str:
        soup = BeautifulSoup(text, "lxml")
        for mention_tag in soup.find_all(DescriptionMentionParser.is_html_mention_tag):
            mention_name = mention_tag.attrs.get("username")
            if mention_name:
                user_api = UserApi(session=session, config=config, current_user=None)
                user_id = user_api.get_one_by_username(mention_name).user_id
                text = text.replace(f'username="{mention_name}"', f'userid="{user_id}"')
        return text

    def get_mentions(self, revision: ContentRevisionRO) -> typing.List[Mention]:
        return self.get_mentions_from_html(revision.raw_content)

    @classmethod
    def is_html_mention_tag(cls, tag: Tag) -> bool:
        return cls.MENTION_TAG_NAME == tag.name

    # TODO - MP - 2022-11-29 - Check the variable names
    # TODO - MP - 2022-11-29 - Edited mention are not handled
    @classmethod
    def get_mentions_from_html(cls, html: str) -> typing.List[Mention]:
        # NOTE S.G - 2020-07-30 - using lxml parser as it is the fastest in beautifulsoup
        soup = BeautifulSoup(html, "lxml")
        mentions = []
        for mention_tag in soup.find_all(DescriptionMentionParser.is_html_mention_tag):
            # NOTE MP - 2022-11-16 - Fetching mentions that are typed by hand
            # The mention either has userid or rolelevel
            user_id: int = mention_tag.attrs.get("userid")
            if user_id:
                id_ = str(uuid.uuid4())
                mentions.append(Mention(MentionType.USER, user_id, id_))
                continue
            role_level: int = mention_tag.attrs.get("rolelevel")
            if role_level:
                id_ = str(uuid.uuid4())
                mentions.append(Mention(MentionType.ROLE, role_level, id_))
                continue
        return mentions


class MentionBuilder:
    """Build mentions when contents are created/modified.

    Mentions are currently implemented for contents descriptions which supports:
      - html-document
      - comments
      - threads
    content types since those use description as their storage.
    """

    _parsers = {
        COMMENT_TYPE: DescriptionMentionParser()
    }  # type: typing.Dict[str, BaseMentionParser]

    MENTION_FIELD = "mention"

    @classmethod
    def register_content_type_parser(cls, content_type: str, parser: BaseMentionParser) -> None:
        cls._parsers[content_type] = parser

    @hookimpl
    def on_content_created(self, content: Content, context: TracimContext) -> None:
        try:
            parser = self._parsers[content.type]
        except KeyError:
            logger.info(
                self, "No mention parser for '{}' content type, doing nothing".format(content.type),
            )
            return

        mentions = parser.get_mentions(content.current_revision)
        if not mentions:
            return
        self._create_mention_events(mentions, content, context)

    @hookimpl
    def on_content_modified(self, content: Content, context: TracimContext) -> None:
        try:
            parser = self._parsers[content.type]
        except KeyError:
            logger.info(
                self, "No mention parser for '{}' content type, doing nothing".format(content.type),
            )
            return

        mentions = parser.get_mentions(content.current_revision)
        if not mentions:
            return

        try:
            old_mentions = parser.get_mentions(content.revisions[-2])
        except IndexError:
            old_mentions = set()
        new_mentions = set(mentions) - set(old_mentions)

        if not new_mentions:
            return

        self._create_mention_events(new_mentions, content, context)

    @classmethod
    def get_receiver_ids(
        cls, event: Event, session: TracimSession, config: CFG
    ) -> typing.Iterable[int]:
        mention = event.fields.get(cls.MENTION_FIELD)
        recipient = mention["recipient"]
        if mention["type"] == MentionType.USER:
            return [int(recipient)]
        elif mention["type"] == MentionType.ROLE:
            role_api = RoleApi(session=session, config=config, current_user=None)
            min_level = WorkspaceRoles.get_role_from_level(int(recipient))
            return role_api.get_workspace_member_ids(event.workspace_id, min_level)

    @classmethod
    def _create_mention_events(
        cls, mentions: typing.Iterable[Mention], content: Content, context: TracimContext
    ) -> None:
        role_api = RoleApi(session=context.dbsession, config=context.app_config, current_user=None)
        space_members_ids = role_api.get_workspace_member_ids(content.workspace_id)

        for mention in mentions:
            if mention.type == MentionType.ROLE:
                continue

            recipient = mention.recipient
            if int(recipient) not in space_members_ids:
                raise UserNotMemberOfWorkspace(
                    f"The user of id {mention.recipient} is not a member of the workspace of id \
                        {content.workspace_id}"
                )
                # TODO - MP - 2022-11-29 - We should send the notification to a dummy user

        current_user = context.safe_current_user()
        content_api = ContentApi(context.dbsession, current_user, context.app_config)
        content_in_context = content_api.get_content_in_context(content)
        workspace_api = WorkspaceApi(context.dbsession, current_user, context.app_config)
        workspace_in_context = workspace_api.get_workspace_with_context(
            workspace_api.get_one(content_in_context.workspace.workspace_id)
        )
        content_schema = EventApi.get_content_schema_for_type(content.type)
        content_dict = content_schema.dump(content_in_context).data
        common_fields = {
            Event.CONTENT_FIELD: content_dict,
            Event.WORKSPACE_FIELD: EventApi.workspace_schema.dump(workspace_in_context).data,
        }

        event_api = EventApi(current_user, context.dbsession, context.app_config)
        for mention in mentions:
            fields = {
                cls.MENTION_FIELD: {
                    "type": mention.type,
                    "recipient": mention.recipient,
                    "id": mention.id,
                }
            }
            fields.update(common_fields)
            event_api.create_event(
                entity_type=EntityType.MENTION,
                operation=OperationType.CREATED,
                additional_fields=fields,
                context=context,
            )


def register_tracim_plugin(plugin_manager: PluginManager) -> None:
    """Entry point for this plugin."""
    plugin_manager.register(MentionBuilder())
    BaseLiveMessageBuilder.register_entity_type(EntityType.MENTION, MentionBuilder.get_receiver_ids)
