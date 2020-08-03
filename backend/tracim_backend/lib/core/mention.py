import abc
import typing

from bs4 import BeautifulSoup
from bs4 import Tag
from pluggy import PluginManager

from tracim_backend.config import CFG
from tracim_backend.app_models.contents import COMMENT_TYPE
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.event import BaseLiveMessageBuilder
from tracim_backend.lib.core.event import EventApi
from tracim_backend.lib.core.plugins import hookimpl
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.event import EntityType
from tracim_backend.models.event import OperationType
from tracim_backend.models.event import Event
from tracim_backend.models.tracim_session import TracimSession


class Mention:
    """A mention with its attributes: id and recipient."""

    def __init__(self, recipient: str, id_: str) -> None:
        self.recipient = recipient
        self.id = id_

    def __eq__(self, other) -> bool:
        return (
            isinstance(other, Mention) and other.recipient == self.recipient and other.id == self.id
        )

    def __repr__(self) -> str:
        return "<Mention(recipient={}, id={})>".format(self.recipient, self.id)

    def __hash__(self) -> int:
        return hash(self.id)


class BaseMentionParser(abc.ABC):
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
      <span id="mention-{a unique id}">@recipient</span>
    """

    MENTION_ID_START = "mention-"
    MENTION_TAG_NAME = "span"

    def get_mentions(self, revision: ContentRevisionRO) -> typing.List[Mention]:
        return self.get_mentions_from_html(revision.description)

    @classmethod
    def is_html_mention_tag(cls, tag: Tag) -> bool:
        return (
            cls.MENTION_TAG_NAME == tag.name
            and tag.has_attr("id")
            and tag["id"].startswith(cls.MENTION_ID_START)
        )

    @classmethod
    def get_mentions_from_html(cls, html: str) -> typing.List[Mention]:
        # NOTE S.G - 2020-07-30: using lxml parser as it is the fastest in beautifulsoup
        soup = BeautifulSoup(html, "lxml")
        mentions = []
        for mention_tag in soup.find_all(DescriptionMentionParser.is_html_mention_tag):
            recipient = mention_tag.string[1:]
            id_ = mention_tag["id"].replace(cls.MENTION_ID_START, "")
            mentions.append(Mention(recipient, id_))
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

        old_mentions = parser.get_mentions(content.revisions[-2])
        new_mentions = set(mentions) - set(old_mentions)
        if not new_mentions:
            return

        self._create_mention_events(new_mentions, content, context)

    @classmethod
    def get_receiver_ids(
        cls, event: Event, session: TracimSession, config: CFG
    ) -> typing.Iterable[int]:
        # FIXME: S.G 2020-07-29 - return proper receiver ids from the event's mention field (#3349)
        return []

    @classmethod
    def _create_mention_events(
        cls, mentions: typing.Iterable[Mention], content: Content, context: TracimContext
    ) -> None:
        current_user = context.current_user
        content_api = ContentApi(context.dbsession, current_user, context.app_config)
        content_in_context = content_api.get_content_in_context(content)
        workspace_api = WorkspaceApi(context.dbsession, current_user, context.app_config)
        workspace_in_context = workspace_api.get_workspace_with_context(
            workspace_api.get_one(content_in_context.workspace.workspace_id)
        )
        content_schema = EventApi.get_content_schema_for_type(content.type)
        content_dict = content_schema.dump(content_in_context).data
        common_fields = {
            EventApi.CONTENT_FIELD: content_dict,
            EventApi.WORKSPACE_FIELD: EventApi.workspace_schema.dump(workspace_in_context).data,
        }

        event_api = EventApi(context.current_user, context.dbsession, context.app_config)
        for mention in mentions:
            fields = {cls.MENTION_FIELD: {"recipient": mention.recipient, "id": mention.id}}
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
