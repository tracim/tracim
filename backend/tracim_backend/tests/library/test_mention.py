import typing

import pytest
import transaction

from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.mention import DescriptionMentionParser
from tracim_backend.lib.core.mention import Mention
from tracim_backend.lib.core.mention import MentionBuilder
from tracim_backend.lib.core.mention import MentionType
from tracim_backend.lib.utils.request import TracimContext
from tracim_backend.models.auth import Profile
from tracim_backend.models.data import Content
from tracim_backend.models.event import EntityType
from tracim_backend.models.event import Event
from tracim_backend.models.event import OperationType
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa F403,F401
from tracim_backend.tests.utils import TracimTestContext

html_with_one_mention_bar = '<p>Foo <html-mention userid="2"></html-mention></p>'

comment_without_mention = (
    "<p>Bonjour,</p>"
    "<p>Pour clarifier les chose dans tracim, j'ai regarder pour la question des contributor software agreement.</p>"
    "<p>&nbsp;</p><p>La p&ecirc;che n'a pas &eacute;t&eacute; tr&egrave;s bonne c&ocirc;t&eacute; mediainfo, "
    "en effet bien qu'il semble qu'il existe un tel document (https://mediaarea.net/blog/2018/03/20/Why-we-changed-MediaConch-license)"
    ", je ne l'ai pas trouv&eacute;. Il n'est ni disponible sur le d&eacute;p&ocirc;t de source github, "
    "ni sur leur site.</p><p>&nbsp;</p><p>Autrement sur le sujet, y'a bien jitsi qui utilise &ccedil;a avec un bot"
    ' : <a href="https://github.com/ibauersachs/cla-enforcer">https://github.com/ibauersachs/cla-enforcer</a></p>'
    "<p>et probablement plus utile, un g&eacute;n&eacute;rateur de cla: http://selector.harmonyagreements.org/</p>"
)

html_with_several_mentions = (
    '<p><html-mention userid="2"></html-mention> <html-mention roleid="0"></html-mention></p>'
)


def create_content(
    raw_content: str,
    user_api_factory,
    workspace_api_factory,
    session,
    app_config,
    content_type: str = "html-document",
    parent_content: typing.Optional[Content] = None,
) -> Content:
    with transaction.manager:
        uapi = user_api_factory.get()
        try:
            user = uapi.get_one_by_email(email="this.is@user")
        except Exception:
            user = uapi.create_minimal_user(
                email="this.is@user", profile=Profile.ADMIN, save_now=True, username="bar"
            )
        if parent_content:
            workspace = parent_content.workspace
        else:
            space_api = workspace_api_factory.get(user)
            workspace = space_api.create_workspace("test workspace", save_now=True)
        api = ContentApi(current_user=user, session=session, config=app_config)
        content = api.create(
            content_type_slug=content_type,
            workspace=workspace,
            parent=parent_content,
            label="Content",
            do_save=True,
        )

        with new_revision(session=session, tm=transaction.manager, content=content):
            api.update_content(content, new_label=content.label, new_raw_content=raw_content)
            api.save(content)
    return content


@pytest.fixture
def one_content_with_a_mention(
    base_fixture, user_api_factory, workspace_api_factory, session, app_config
) -> Content:
    return create_content(
        html_with_one_mention_bar, user_api_factory, workspace_api_factory, session, app_config,
    )


@pytest.fixture
def one_content_without_mention(
    base_fixture, user_api_factory, workspace_api_factory, session, app_config
) -> Content:
    return create_content(
        comment_without_mention, user_api_factory, workspace_api_factory, session, app_config,
    )


@pytest.fixture
def one_content_with_a_mention_all(
    base_fixture, user_api_factory, workspace_api_factory, session, app_config
) -> Content:
    return create_content(
        '<p><html-mention roleid="0"></html-mention></p>',
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
    )


@pytest.fixture
def one_updated_content_with_one_new_mention(
    base_fixture, user_api_factory, workspace_api_factory, session, app_config,
) -> Content:
    content = create_content(
        "<p>Hello, world</p>", user_api_factory, workspace_api_factory, session, app_config,
    )
    with new_revision(session=session, tm=transaction.manager, content=content):
        api = ContentApi(current_user=content.owner, session=session, config=app_config)
        api.update_content(
            content,
            new_label=content.label,
            new_raw_content=content.raw_content + '<html-mention userid="2"></html-mention>',
        )
        api.save(content)
    return content


@pytest.fixture
def one_updated_content_with_no_new_mention(
    base_fixture, user_api_factory, workspace_api_factory, session, app_config
) -> Content:
    content = create_content(
        '<p><html-mention userid="2"></html-mention></p>',
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
    )
    with new_revision(session=session, tm=transaction.manager, content=content):
        api = ContentApi(current_user=content.owner, session=session, config=app_config)
        api.update_content(
            content,
            new_label=content.label,
            new_raw_content=content.raw_content + "<p>Hello, world</p>",
        )
        api.save(content)
    return content


@pytest.fixture
def one_updated_content_with_new_mention_all(
    base_fixture, user_api_factory, workspace_api_factory, session, app_config
) -> Content:
    content = create_content(
        "<p>Hello, world</p>", user_api_factory, workspace_api_factory, session, app_config,
    )
    with new_revision(session=session, tm=transaction.manager, content=content):
        api = ContentApi(current_user=content.owner, session=session, config=app_config)
        api.update_content(
            content,
            new_label=content.label,
            new_raw_content=content.raw_content + '<html-mention roleid="0"></html-mention>',
        )
        api.save(content)
    return content


@pytest.fixture
def one_comment_with_a_mention(
    base_fixture,
    user_api_factory,
    workspace_api_factory,
    session,
    app_config,
    one_content_with_a_mention: Content,
) -> Content:
    return create_content(
        html_with_one_mention_bar,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        parent_content=one_content_with_a_mention,
        content_type="comment",
    )


def pending_mention_events_count(context: TracimContext) -> bool:
    return sum(event.entity_type == EntityType.MENTION for event in context.pending_events)


class TestMentionBuilder:
    @pytest.mark.parametrize(
        "html,mentions",
        [
            (html_with_one_mention_bar, [Mention(MentionType.USER, 2, 0)]),
            (comment_without_mention, []),
            (
                html_with_several_mentions,
                [Mention(MentionType.USER, 2, 0), Mention(MentionType.ROLE, 0, 0)],
            ),
        ],
    )
    def test_unit_get_mentions_from_html__ok__nominal_cases(
        self, html: str, mentions: typing.List[Mention]
    ) -> None:
        for idx, new_mention in enumerate(DescriptionMentionParser.get_mentions_from_html(0, html)):
            assert new_mention == mentions[idx]

    def test_unit_on_content_created__ok__nominal_case(
        self, session_factory, app_config, one_content_with_a_mention: Content
    ) -> None:
        builder = MentionBuilder()
        context = TracimTestContext(
            app_config, session_factory, user=one_content_with_a_mention.owner
        )
        builder.on_content_created(one_content_with_a_mention, context)
        assert 1 == len(context.pending_events)
        mention_event = context.pending_events[0]
        assert EntityType.MENTION == mention_event.entity_type
        assert OperationType.CREATED == mention_event.operation
        assert "author" in mention_event.fields
        assert "client_token" in mention_event.fields
        assert "content" in mention_event.fields
        assert "workspace" in mention_event.fields
        assert {"type": MentionType.USER, "recipient": 2, "content_id": 1} == mention_event.fields[
            "mention"
        ]

    def test_unit_on_content_created__ok__comment(
        self, session_factory, app_config, one_comment_with_a_mention: Content
    ) -> None:
        builder = MentionBuilder()
        context = TracimTestContext(
            app_config, session_factory, user=one_comment_with_a_mention.owner
        )
        builder.on_content_created(one_comment_with_a_mention, context)
        assert 1 == len(context.pending_events)
        mention_event = context.pending_events[0]
        assert "content" in mention_event.fields
        assert mention_event.content["parent_content_type"] == "html-document"
        assert mention_event.content["parent_content_namespace"] == "content"

    def test_unit_on_content_created__ok__no_mention(
        self, session_factory, app_config, one_content_without_mention: Content
    ) -> None:
        builder = MentionBuilder()
        context = TracimTestContext(
            app_config, session_factory, user=one_content_without_mention.owner
        )
        builder.on_content_created(one_content_without_mention, context)
        assert pending_mention_events_count(context) == 0

    def test_unit_on_content_created__ok__mention_all(
        self, session_factory, app_config, one_content_with_a_mention_all: Content
    ) -> None:
        builder = MentionBuilder()
        context = TracimTestContext(
            app_config, session_factory, user=one_content_with_a_mention_all.owner
        )
        builder.on_content_created(one_content_with_a_mention_all, context)
        assert pending_mention_events_count(context) == 1

    def test_unit_on_content_modified__ok__one_new_mention(
        self, session_factory, app_config, one_updated_content_with_one_new_mention: Content
    ) -> None:
        builder = MentionBuilder()
        context = TracimTestContext(
            app_config, session_factory, user=one_updated_content_with_one_new_mention.owner
        )
        builder.on_content_modified(one_updated_content_with_one_new_mention, context)
        assert 1 == len(context.pending_events)
        mention_event = context.pending_events[0]
        assert EntityType.MENTION == mention_event.entity_type
        assert OperationType.CREATED == mention_event.operation
        assert {"type": MentionType.USER, "recipient": 2, "content_id": 1} == mention_event.fields[
            "mention"
        ]

    def test_unit_on_content_modified__ok__no_new_mention(
        self, session_factory, app_config, one_updated_content_with_no_new_mention: Content
    ) -> None:
        builder = MentionBuilder()
        context = TracimTestContext(
            app_config, session_factory, user=one_updated_content_with_no_new_mention.owner
        )
        builder.on_content_modified(one_updated_content_with_no_new_mention, context)
        assert pending_mention_events_count(context) == 0

    def test_unit_on_content_modified__ok__new_mention_all(
        self, session_factory, app_config, one_updated_content_with_new_mention_all: Content
    ) -> None:
        builder = MentionBuilder()
        context = TracimTestContext(
            app_config, session_factory, user=one_updated_content_with_new_mention_all.owner
        )
        builder.on_content_modified(one_updated_content_with_new_mention_all, context)
        assert pending_mention_events_count(context) == 1

    @pytest.mark.parametrize(
        "mention_type, recipient, receiver_ids",
        [(MentionType.ROLE, 0, [2]), (MentionType.USER, 2, [2])],
    )
    def test_unit_get_receiver_ids(
        self,
        mention_type: MentionType,
        recipient: int,
        receiver_ids: typing.Tuple[int],
        one_content_with_a_mention: Content,
        session,
        app_config,
    ) -> None:
        event = Event(
            entity_type=EntityType.MENTION,
            operation=OperationType.CREATED,
            fields={
                "mention": {"type": mention_type, "recipient": recipient, "content_id": "0"},
                "workspace": {"workspace_id": one_content_with_a_mention.workspace.workspace_id},
            },
            workspace_id=one_content_with_a_mention.workspace.workspace_id,
        )
        assert receiver_ids == MentionBuilder.get_receiver_ids(event, session, app_config)
