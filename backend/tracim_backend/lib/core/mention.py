import abc
from bs4 import BeautifulSoup
from bs4 import Tag
from pluggy import PluginManager
import typing

from tracim_backend.app_models.contents import ContentTypeSlug
from tracim_backend.config import CFG
from tracim_backend.exceptions import InvalidMention
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
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.event import EntityType
from tracim_backend.models.event import Event
from tracim_backend.models.event import OperationType
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.models.tracim_session import TracimSession

USER_ID = "userid"
ROLE_ID = "roleid"


class MentionType:
    USER = 1
    ROLE = 2


class Mention:
    """A mention with its attributes: id and recipient."""

    def __init__(self, type: MentionType, recipient: int, content_id: int) -> None:
        self.type = type
        self.recipient = recipient
        self.content_id = content_id

    def __eq__(self, other) -> bool:
        return (
            isinstance(other, Mention)
            and self.type == other.type
            and self.recipient == other.recipient
            and self.content_id == other.content_id
        )

    def __repr__(self) -> str:
        return (
            f"<Mention(type={self.type}, recipient={self.recipient}, content_id={self.content_id})>"
        )

    def __hash__(self) -> int:
        return hash((self.type, self.recipient, self.content_id))


class BaseMentionParser(abc.ABC):
    """Base class for mention parsers."""

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
      `<html-mention {DATA}></html-mention>`

    DATA should be one of theses:
     - userid="{user_id}"
     - roleid="{role_id}"
    """

    MENTION_TAG_NAME = "html-mention"

    def get_mentions(self, revision: ContentRevisionRO) -> typing.List[Mention]:
        return self.get_mentions_from_html(revision.content_id, revision.raw_content)

    @classmethod
    def is_html_mention_tag(cls, tag: Tag) -> bool:
        return cls.MENTION_TAG_NAME == tag.name and (tag.has_attr(USER_ID) or tag.has_attr(ROLE_ID))

    @classmethod
    def get_mentions_from_html(cls, content_id: int, html: str) -> typing.List[Mention]:
        # NOTE S.G - 2020-07-30 - using lxml parser as it is the fastest in beautifulsoup
        soup = BeautifulSoup(html, "lxml")
        mentions = []
        for mention_tag in soup.find_all(DescriptionMentionParser.is_html_mention_tag):
            user_id = mention_tag.attrs.get(USER_ID)
            role_id = mention_tag.attrs.get(ROLE_ID)
            if user_id and user_id != "":
                mentions.append(Mention(MentionType.USER, int(user_id), content_id))
                continue
            elif role_id and role_id != "":
                mentions.append(Mention(MentionType.ROLE, int(role_id), content_id))
                continue
            raise InvalidMention(
                f"The current mention is empty: no userid and no roleid specified."  # noqa: F541
            )
        return mentions

    @classmethod
    def get_email_html_from_html_with_mention_tags(
        cls, session: TracimSession, cfg: CFG, translator: Translator, html: str
    ) -> str:
        """
        This method will replace every mention tag by a simple string mention.
        :param session: session to use for database access
        :param cfg: current config
        :param translator: translator to use for role translation
        :param html: html to parse
        :return: html with mention tags replaced by simple string mention

        Example:
        ```
        html = <div>Hello <html-mention userid="1"></html-mention>!</div>
        return = <div>Hello @foo!</div>
        ```
        Where @foo is the username of user with id 1
        """

        soup = BeautifulSoup(html, "lxml")
        _ = translator.get_translation

        for mention_tag in soup.find_all(DescriptionMentionParser.is_html_mention_tag):
            user_id = mention_tag.attrs.get(USER_ID)
            role_id = mention_tag.attrs.get(ROLE_ID)
            if user_id and user_id != "":
                user = UserApi(current_user=None, session=session, config=cfg).get_one(user_id)
                mention_tag.replaceWith(f"@{user.username}")
            elif role_id and role_id != "":
                # TODO - MP - 2023-04-24 - Since we don't have any other role mention than "all"
                # we can hardcode it for now. We should find a way to handle other roles
                all = _("all")
                mention_tag.replaceWith(f"@{all}")
        return str(soup)


class MentionBuilder:
    """Build mentions when contents are created/modified.

    Mentions are currently implemented for contents descriptions which supports:
      - html-document
      - comments
      - threads
    content types since those use description as their storage.
    """

    _parsers = {
        ContentTypeSlug.COMMENT.value: DescriptionMentionParser()
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
                self,
                "No mention parser for '{}' content type, doing nothing".format(content.type),
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
                self,
                "No mention parser for '{}' content type, doing nothing".format(content.type),
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
        cls,
        mentions: typing.Iterable[Mention],
        content: Content,
        context: TracimContext,
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
        workspace_api = WorkspaceApi(
            context.dbsession, current_user, context.app_config, show_deleted=True
        )
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
                    "content_id": mention.content_id,
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
