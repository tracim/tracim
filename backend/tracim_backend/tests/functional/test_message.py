# -*- coding: utf-8 -*-
import datetime
import typing

import pytest
from sqlalchemy import and_
from sqlalchemy import null
import transaction

from tracim_backend.lib.utils.utils import DATETIME_FORMAT
import tracim_backend.models.event as tracim_event
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


def create_user_messages(
    session,
    is_read: bool = True,
    sent_date: typing.Optional[datetime.datetime] = None,
    remove_existing_events: bool = True,
) -> typing.List[tracim_event.Message]:
    """
    Will generate 3 user events and their associated messages (3 messages)

    Args:
        is_read (bool, optional): Should the messages be read? Defaults to True.
        sent_date (typing.Optional[datetime.datetime], optional): When the events should be sent?.\
            Defaults to None.
        remove_existing_events (bool, optional): Should remove the existing events? Defaults to\
            True.

    Returns:
        typing.List[tracim_event.Message]: Messages created.
    """
    messages = []
    with transaction.manager:
        # remove messages created by the base fixture
        if remove_existing_events:
            session.query(tracim_event.Message).delete()

        read_datetime = None
        if is_read:
            read_datetime = datetime.datetime.utcnow()

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.USER,
            operation=tracim_event.OperationType.CREATED,
            fields={"example": "hello", "author": {"user_id": 1}},
            author_id=1,
        )
        session.add(event)
        messages.append(
            tracim_event.Message(event=event, receiver_id=1, read=read_datetime, sent=sent_date)
        )

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.USER,
            operation=tracim_event.OperationType.MODIFIED,
            fields={"example": "bar", "author": {"user_id": 2}},
            author_id=2,
        )
        session.add(event)
        messages.append(
            tracim_event.Message(event=event, receiver_id=1, read=read_datetime, sent=sent_date)
        )

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.USER,
            operation=tracim_event.OperationType.MODIFIED,
            fields={"example": "event without author", "author": None},
            author_id=None,
        )
        session.add(event)
        messages.append(
            tracim_event.Message(event=event, receiver_id=1, read=read_datetime, sent=sent_date)
        )

        session.add_all(messages)
        session.flush()
    transaction.commit()
    messages.reverse()
    return messages


def create_space_messages(
    session,
    is_read: bool = True,
    sent_date: typing.Optional[datetime.datetime] = None,
    remove_existing_events: bool = True,
) -> typing.List[tracim_event.Message]:
    """
    Will generate 3 space events and their associated messages (3 messages)

    Args:
        is_read (bool, optional): Should the messages be read? Defaults to True.
        sent_date (typing.Optional[datetime.datetime], optional): When the events should be sent?.\
            Defaults to None.
        remove_existing_events (bool, optional): Should remove the existing events? Defaults to\
            True.

    Returns:
        typing.List[tracim_event.Message]: Messages created.
    """
    messages = []
    with transaction.manager:
        # remove messages created by the base fixture
        if remove_existing_events:
            session.query(tracim_event.Message).delete()
        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.WORKSPACE,
            operation=tracim_event.OperationType.CREATED,
            fields={"author": {"user_id": 1}, "workspace": {"workspace_id": 1}},
            workspace_id=1,
            author_id=1,
        )
        session.add(event)
        read_datetime = None
        if is_read:
            read_datetime = datetime.datetime.utcnow()
        messages.append(
            tracim_event.Message(event=event, receiver_id=1, read=read_datetime, sent=sent_date)
        )

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.WORKSPACE_MEMBER,
            operation=tracim_event.OperationType.MODIFIED,
            fields={"author": {"user_id": 2}, "workspace": {"workspace_id": 2}},
            workspace_id=2,
            author_id=2,
        )
        session.add(event)
        messages.append(tracim_event.Message(event=event, receiver_id=1, sent=sent_date))

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.USER,
            operation=tracim_event.OperationType.MODIFIED,
            fields={"example": "event without author", "author": None},
        )
        session.add(event)
        messages.append(tracim_event.Message(event=event, receiver_id=1, sent=sent_date))

        session.add_all(messages)
        session.flush()
    transaction.commit()
    messages.reverse()
    return messages


def create_content_messages(
    session,
    is_read: bool = True,
    sent_date: typing.Optional[datetime.datetime] = None,
    remove_existing_events: bool = True,
) -> typing.List[tracim_event.Message]:
    """
    Will generate 4 content events and their associated messages (4 messages)

    Args:
        is_read (bool, optional): Should the messages be read? Defaults to True.
        sent_date (typing.Optional[datetime.datetime], optional): When the events should be sent?.\
            Defaults to None.
        remove_existing_events (bool, optional): Should remove the existing events? Defaults to\
            True.

    Returns:
        typing.List[tracim_event.Message]: Messages created.
    """
    messages = []
    with transaction.manager:
        # remove messages created by the base fixture
        if remove_existing_events:
            session.query(tracim_event.Message).delete()
        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.CONTENT,
            operation=tracim_event.OperationType.CREATED,
            fields={"author": {"user_id": 1}, "content": {"content_id": 1, "parent_id": None}},
            content_id=1,
            author_id=1,
        )
        session.add(event)
        read_datetime = None
        if is_read:
            read_datetime = datetime.datetime.utcnow()
        messages.append(
            tracim_event.Message(event=event, receiver_id=1, read=read_datetime, sent=sent_date)
        )

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.CONTENT,
            operation=tracim_event.OperationType.CREATED,
            fields={"author": {"user_id": 2}, "content": {"content_id": 2, "parent_id": 1}},
            author_id=2,
            content_id=2,
            parent_id=1,
        )
        session.add(event)
        messages.append(tracim_event.Message(event=event, receiver_id=1, sent=sent_date))

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.WORKSPACE,
            operation=tracim_event.OperationType.CREATED,
            fields={"author": {"user_id": 2}, "content": {"content_id": 3, "parent_id": None}},
            author_id=2,
            content_id=3,
        )
        session.add(event)
        messages.append(tracim_event.Message(event=event, receiver_id=1, sent=sent_date))

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.CONTENT,
            operation=tracim_event.OperationType.CREATED,
            fields={"author": {"user_id": 2}, "content": {"content_id": 4, "parent_id": 3}},
            author_id=2,
            content_id=4,
            parent_id=3,
        )
        session.add(event)
        messages.append(tracim_event.Message(event=event, receiver_id=1, sent=sent_date))
        session.add_all(messages)
        session.flush()
    transaction.commit()
    messages.reverse()
    return messages


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestMessages(object):
    """
    Tests for /api/users/{user_id}/messages endpoint
    """

    @pytest.mark.parametrize("read_status", ["all", "read", "unread"])
    def test_api__get_messages__ok_200__nominal_case(
        self, session, web_testapp, read_status: str
    ) -> None:
        """
        Get messages through the classic HTTP endpoint.
        """
        messages = create_user_messages(session, sent_date=datetime.datetime.utcnow())
        if read_status == "read":
            messages = [m for m in messages if m.read]
        elif read_status == "unread":
            messages = [m for m in messages if not m.read]

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.get(
            "/api/users/1/messages?read_status={}".format(read_status), status=200,
        ).json_body
        message_dicts = result.get("items")
        assert len(messages) == len(message_dicts)
        for message, message_dict in zip(messages, message_dicts):
            assert {
                "event_id": message.event_id,
                "event_type": message.event_type,
                "fields": message.fields,
                "created": message.created.strftime(DATETIME_FORMAT),
                "read": message.read.strftime(DATETIME_FORMAT) if message.read else None,
            } == message_dict

    @pytest.mark.parametrize("include_not_sent", [True, False])
    def test_api__get_messages__ok_200__include_not_sent__no_sent_date_set(
        self, session, web_testapp, include_not_sent: str
    ) -> None:
        """
        Get messages through the classic HTTP endpoint.
        """
        messages = create_user_messages(session, sent_date=None)
        if not include_not_sent:
            messages = []

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.get(
            "/api/users/1/messages?include_not_sent={}".format(str(int(include_not_sent))),
            status=200,
        ).json_body
        message_dicts = result.get("items")
        assert len(messages) == len(message_dicts)
        for message, message_dict in zip(messages, message_dicts):
            assert {
                "event_id": message.event_id,
                "event_type": message.event_type,
                "fields": message.fields,
                "created": message.created.strftime(DATETIME_FORMAT),
                "read": message.read.strftime(DATETIME_FORMAT) if message.read else None,
            } == message_dict

    def test_api__get_messages__ok_200__exclude_author_ids_filter(
        self, session, web_testapp
    ) -> None:
        """
        Get messages through the classic HTTP endpoint. Filter by author_ids
        """
        messages = create_user_messages(session, sent_date=datetime.datetime.utcnow())

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        result = web_testapp.get("/api/users/1/messages?exclude_author_ids=", status=200,).json_body
        message_dicts = result.get("items")
        assert len(message_dicts) == len(messages)

        result = web_testapp.get(
            "/api/users/1/messages?exclude_author_ids=1", status=200,
        ).json_body
        message_dicts = result.get("items")
        assert len(message_dicts) == len(
            [
                m
                for m in messages
                if (not m.fields["author"]) or (m.fields["author"]["user_id"] != 1)
            ]
        )

        result = web_testapp.get(
            "/api/users/1/messages?exclude_author_ids=1,2", status=200,
        ).json_body
        message_dicts = result.get("items")

        assert len(message_dicts) == len(
            [
                m
                for m in messages
                if (not m.fields["author"]) or (m.fields["author"]["user_id"] not in (1, 2))
            ]
        )

    @pytest.mark.parametrize("event_type", ["user.created", "user.modified", ""])
    def test_api__get_messages__ok_200__include_event_type_filter(
        self, session, web_testapp, event_type: str
    ) -> None:
        """
        Get messages through the classic HTTP endpoint. Filter by event_type
        """
        messages = create_user_messages(session, sent_date=datetime.datetime.utcnow())

        if event_type:
            messages = [m for m in messages if m.event_type == event_type]

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.get(
            "/api/users/1/messages?include_event_types={}".format(event_type), status=200,
        ).json_body
        message_dicts = result.get("items")
        assert len(messages) == len(message_dicts)
        for message, message_dict in zip(messages, message_dicts):
            assert {
                "event_id": message.event_id,
                "event_type": message.event_type,
                "fields": message.fields,
                "created": message.created.strftime(DATETIME_FORMAT),
                "read": message.read.strftime(DATETIME_FORMAT) if message.read else None,
            } == message_dict

    @pytest.mark.parametrize(
        "include_event_types, exclude_event_types, valid_event_types",
        [
            pytest.param(
                (),
                (),
                (
                    "user.modified",
                    "user.created",
                    "workspace.created",
                    "workspace_member.modified",
                    "content.created",
                ),
                id="get all events type created",
            ),
            pytest.param(
                ("user.*",), (), ("user.modified", "user.created"), id="include only user type",
            ),
            pytest.param(
                ("user",), (), ("user.modified", "user.created"), id="include only user type bis",
            ),
            pytest.param(
                ("user.modified", "user.created"),
                (),
                ("user.modified", "user.created"),
                id="include only user type, explicit",
            ),
            pytest.param(
                ("user.*",),
                ("user.modified",),
                ("user.created",),
                id="include only user type but excluded modified event",
            ),
            pytest.param(
                ("user.*", "workspace.*", "content.created"),
                ("user.modified", "workspace.modified"),
                ("content.created", "user.created", "content.created", "workspace.created"),
                id="include and exclude complex case",
            ),
            pytest.param(
                (),
                ("user.*",),
                ("workspace.created", "workspace_member.modified", "content.created"),
                id="exclude wildcard user",
            ),
            pytest.param(
                (),
                ("user.created",),
                (
                    "workspace.created",
                    "workspace_member.modified",
                    "content.created",
                    "user.modified",
                ),
                id="exclude simple case",
            ),
        ],
    )
    def test_api__get_messages__ok_200__include_exclude_event_type_filters(
        self,
        session,
        web_testapp,
        include_event_types: typing.List[str],
        exclude_event_types: typing.List[str],
        valid_event_types: typing.List[str],
    ) -> None:
        """
        Get messages through the classic HTTP endpoint. Filter by event_type
        """
        messages = create_user_messages(
            session, sent_date=datetime.datetime.utcnow(), remove_existing_events=False
        )
        messages.extend(
            create_content_messages(
                session, sent_date=datetime.datetime.utcnow(), remove_existing_events=False
            )
        )
        messages.extend(
            create_space_messages(
                session, sent_date=datetime.datetime.utcnow(), remove_existing_events=False
            )
        )

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        include_events_type_str = ",".join(include_event_types)
        exclude_events_type_str = ",".join(exclude_event_types)
        result = web_testapp.get(
            "/api/users/1/messages?include_event_types={}&exclude_event_types={}".format(
                include_events_type_str, exclude_events_type_str
            ),
            status=200,
        ).json_body
        message_dicts = result.get("items")
        for message_dict in message_dicts:
            assert message_dict["event_type"] in valid_event_types

    @pytest.mark.parametrize("workspace_ids", [[], [1, 2], [1], [2]])
    def test_api__get_messages__ok_200__workspace_filter(
        self, session, web_testapp, workspace_ids
    ) -> None:
        """
        Get messages through the classic HTTP endpoint. Filter by workspace_id
        """
        messages = create_space_messages(session, sent_date=datetime.datetime.utcnow())
        if workspace_ids:
            new_messages = []
            for m in messages:
                if m.event.workspace_id and m.event.workspace_id in workspace_ids:
                    new_messages.append(m)
            messages = new_messages
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        workspace_ids_str = ",".join([str(wid) for wid in workspace_ids])
        result = web_testapp.get(
            "/api/users/1/messages?workspace_ids={}".format(workspace_ids_str), status=200,
        ).json_body
        message_dicts = result.get("items")
        assert len(messages) == len(message_dicts)
        for message, message_dict in zip(messages, message_dicts):
            assert {
                "event_id": message.event_id,
                "event_type": message.event_type,
                "fields": message.fields,
                "created": message.created.strftime(DATETIME_FORMAT),
                "read": message.read.strftime(DATETIME_FORMAT) if message.read else None,
            } == message_dict

    @pytest.mark.parametrize("related_to_content_ids", [[], [1, 2], [1], [2]])
    def test_api__get_messages__ok_200__content_filter(
        self, session, web_testapp, related_to_content_ids
    ) -> None:
        """
        Get messages through the classic HTTP endpoint. Filter by content_id and content parent_id
        """
        messages = create_content_messages(session, sent_date=datetime.datetime.utcnow())
        if related_to_content_ids:
            new_messages = []
            for m in messages:
                if m.event.fields.get("content"):
                    if m.event.content["content_id"] in related_to_content_ids:
                        new_messages.append(m)
                    elif m.event.content["parent_id"] in related_to_content_ids:
                        new_messages.append(m)
            messages = new_messages
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        related_to_content_ids_str = ",".join([str(wid) for wid in related_to_content_ids])
        result = web_testapp.get(
            "/api/users/1/messages?related_to_content_ids={}".format(related_to_content_ids_str),
            status=200,
        ).json_body
        message_dicts = result.get("items")
        assert len(messages) == len(message_dicts)
        for message, message_dict in zip(messages, message_dicts):
            assert {
                "event_id": message.event_id,
                "event_type": message.event_type,
                "fields": message.fields,
                "created": message.created.strftime(DATETIME_FORMAT),
                "read": message.read.strftime(DATETIME_FORMAT) if message.read else None,
            } == message_dict

    @pytest.mark.parametrize(
        "event_type",
        ["something", "user.modified.subtype.subsubtype", "user.donothing", "nothing.deleted"],
    )
    def test_api__get_messages__err_400__invalid_event_type_filter(
        self, session, web_testapp, event_type: str
    ) -> None:
        """
        Check invalid event type case
        """
        messages = create_user_messages(session, sent_date=datetime.datetime.utcnow())

        if event_type:
            messages = [m for m in messages if m.event_type == event_type]

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.get(
            "/api/users/1/messages?include_event_types={}".format(event_type), status=400,
        ).json_body
        assert result["code"] == 2001
        assert result["message"] == "Validation error of input data"

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.get(
            "/api/users/1/messages?exclude_event_types={}".format(event_type), status=400,
        ).json_body
        assert result["code"] == 2001
        assert result["message"] == "Validation error of input data"

    def test_api__get_messages__ok_200__paginate_result(self, session, web_testapp,) -> None:
        """
        Get messages through the classic HTTP endpoint.
        Paginate with both "count" and "before_event_id"
        """
        messages = create_user_messages(session, sent_date=datetime.datetime.utcnow())
        assert len(messages) == 3
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        message_dicts_0 = web_testapp.get("/api/users/1/messages", status=200,).json_body.get(
            "items"
        )
        message_dicts_1 = web_testapp.get(
            "/api/users/1/messages?count=10", status=200,
        ).json_body.get("items")
        message_dicts_2 = web_testapp.get(
            "/api/users/1/messages?count=3", status=200,
        ).json_body.get("items")
        assert len(message_dicts_0) == 3
        assert message_dicts_0 == message_dicts_1 == message_dicts_2
        assert message_dicts_0[0]["event_id"] == 4
        assert message_dicts_0[1]["event_id"] == 3

        result = web_testapp.get("/api/users/1/messages?count=1", status=200,).json_body
        message_dicts = result.get("items")
        assert message_dicts
        assert len(message_dicts) == 1
        assert message_dicts_0[0]["event_id"] == 4

        assert result["has_previous"] is False
        assert result["has_next"] is True
        next_page = result["next_page_token"]
        assert next_page
        assert result["per_page"] == 1

        result = web_testapp.get(
            "/api/users/1/messages?page_token={}".format(next_page), status=200,
        ).json_body
        assert result["has_next"] is False
        assert result["has_previous"] is True
        message_dicts_0 = result.get("items")
        message_dicts_1 = web_testapp.get(
            "/api/users/1/messages?count=10&page_token={}".format(next_page), status=200,
        ).json_body.get("items")
        message_dicts_2 = web_testapp.get(
            "/api/users/1/messages?count=3&page_token={}".format(next_page), status=200,
        ).json_body.get("items")
        message_dicts_3 = web_testapp.get(
            "/api/users/1/messages?count=2&page_token={}".format(next_page), status=200,
        ).json_body.get("items")
        assert message_dicts_0 == message_dicts_1
        assert message_dicts_0 == message_dicts_2
        assert message_dicts_2 == message_dicts_3
        assert len(message_dicts_0) == 2
        assert message_dicts_0[0]["event_id"] == 3

    @pytest.mark.parametrize("count", [-100, -1, 0])
    def test_api__get_messages__ok_400__invalid_count(self, session, web_testapp, count) -> None:
        """
        Check invalid count value
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        message_dicts = web_testapp.get(
            "/api/users/1/messages?count={}".format(count), status=400,
        ).json_body
        assert message_dicts["code"] == 2001
        assert message_dicts["message"] == "Validation error of input data"

    @pytest.mark.parametrize(
        "api_end_url, user_id, params, ids, expected_code, expected_length",
        [
            pytest.param("read", 1, [], [[]], 204, 10, id="read_all"),
            pytest.param("read", 1, ["event_ids"], [[0]], 204, 0, id="read_non_accessible_event",),
            pytest.param("read", 1, ["event_ids"], [[2]], 204, 1, id="read_one_event"),
            pytest.param("read", 1, ["event_ids"], [[2, 4]], 204, 2, id="read_some_events"),
            pytest.param("read", 1, ["content_ids"], [[1]], 204, 1, id="read_one_content"),
            pytest.param("read", 1, ["content_ids"], [[1, 2]], 204, 2, id="read_some_contents"),
            pytest.param("read", 1, ["space_ids"], [[1]], 204, 1, id="read_one_space"),
            pytest.param("read", 1, ["space_ids"], [[1, 2]], 204, 2, id="read_some_spaces"),
            pytest.param("read", 1, ["parent_ids"], [[1]], 204, 1, id="read_on_parent"),
            pytest.param(
                "read",
                1,
                ["parent_ids"],
                [[1, 2]],
                204,
                1,
                id="read_some_parents_with_invalid_second_id",
            ),
            pytest.param("unread", 1, [], [[]], 204, 10, id="unread_all"),
        ],
    )
    def test_api__read_unread_messages__ok_204__nominal_case(
        self,
        session,
        web_testapp,
        api_end_url,
        user_id,
        params,
        ids,
        expected_code,
        expected_length,
    ) -> None:
        """
        Test the API messages/{read/unread}
        """
        is_read = api_end_url == "read"
        create_user_messages(session, is_read=not is_read, sent_date=datetime.datetime.utcnow())
        create_space_messages(
            session,
            is_read=not is_read,
            remove_existing_events=False,
            sent_date=datetime.datetime.utcnow(),
        )
        create_content_messages(
            session,
            is_read=not is_read,
            remove_existing_events=False,
            sent_date=datetime.datetime.utcnow(),
        )

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        end_url_str = "?"
        for param in params:
            ids_str = ",".join([str(i) for i in ids[params.index(param)]])
            end_url_str += f"&{param}={ids_str}"

        web_testapp.put(
            f"/api/users/{user_id}/messages/{api_end_url}{end_url_str}", status=expected_code,
        )

        condition = (
            (tracim_event.Message.read != null())
            if is_read
            else (tracim_event.Message.read == null())
        )
        base_message_query = (
            session.query(tracim_event.Message)
            .join(tracim_event.Event, tracim_event.Message.event_id == tracim_event.Event.event_id)
            .filter(and_(tracim_event.Message.receiver_id == user_id, condition,))
        )
        if "content_ids" in params:
            base_message_query = base_message_query.filter(
                tracim_event.Event.content_id.in_(ids[params.index("content_ids")])
            )
        if "event_ids" in params:
            base_message_query = base_message_query.filter(
                tracim_event.Message.event_id.in_(ids[params.index("event_ids")])
            )
        if "parent_ids" in params:
            base_message_query = base_message_query.filter(
                tracim_event.Event.parent_id.in_(ids[params.index("parent_ids")])
            )
        if "space_ids" in params:
            base_message_query = base_message_query.filter(
                tracim_event.Event.workspace_id.in_(ids[params.index("space_ids")])
            )
        messages = base_message_query.all()

        assert len(messages) == expected_length

    def test_api__read_message__err_400__message_does_not_exist(self, session, web_testapp) -> None:
        """
        Read one message error message does not exist
        """

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.put("/api/users/1/messages/{}/read".format("1000"), status=400)
        assert result.json_body["code"] == 1009

    def test_api__unread_message__err_400__message_does_not_exist(
        self, session, web_testapp
    ) -> None:
        """
        Unread one message error message does not exist
        """

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.put("/api/users/1/messages/{}/unread".format("1000"), status=400)
        assert result.json_body["code"] == 1009

    def test_api__messages_summary__ok_200__nominal_case(self, session, web_testapp) -> None:
        """
        check summary of messages
        """
        create_user_messages(session, is_read=False, sent_date=datetime.datetime.utcnow())

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get("/api/users/1/messages/summary", status=200,).json_body
        assert message_dicts["user_id"] == 1
        assert message_dicts["unread_messages_count"] == 3
        assert message_dicts["read_messages_count"] == 0
        assert message_dicts["messages_count"] == 3
        assert message_dicts["user"]["user_id"] == 1
        assert message_dicts["user"]["username"] == "TheAdmin"

    @pytest.mark.parametrize(
        "include_exclude,event_types,read_messages_count,unread_messages_count",
        [
            ("include", ["user.created", "user.modified"], 0, 3),
            ("include", ["user.created"], 0, 1),
            ("include", ["user.modified"], 0, 2),
            ("exclude", ["user.created", "user.modified"], 0, 0),
            ("exclude", ["user.created"], 0, 2),
            ("exclude", ["user.modified"], 0, 1),
        ],
    )
    def test_api__messages_summary__ok_200__filter_event_types_all(
        self,
        session,
        web_testapp,
        include_exclude,
        event_types,
        read_messages_count,
        unread_messages_count,
    ) -> None:
        """
        check summary of messages
        """
        create_user_messages(session, is_read=False, sent_date=datetime.datetime.utcnow())

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        event_type_filter = ",".join(event_types)
        message_dicts = web_testapp.get(
            "/api/users/1/messages/summary?{}_event_types={}".format(
                include_exclude, event_type_filter
            ),
            status=200,
        ).json_body
        assert message_dicts["user_id"] == 1
        assert message_dicts["unread_messages_count"] == unread_messages_count
        assert message_dicts["read_messages_count"] == read_messages_count
        assert message_dicts["messages_count"] == read_messages_count + unread_messages_count
        assert message_dicts["user"]["user_id"] == 1
        assert message_dicts["user"]["username"] == "TheAdmin"

    @pytest.mark.parametrize(
        "related_to_content_ids, nb_messages",
        [([], 4), ([1, 2], 2), ([1, 2, 3], 4), ([2], 1), ([1], 2)],
    )
    def test_api__messages_summary__ok_200__content_filter(
        self, session, web_testapp, related_to_content_ids, nb_messages
    ) -> None:
        create_content_messages(session, sent_date=datetime.datetime.utcnow())
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        if not related_to_content_ids:
            related_to_content_ids_str = ""
        else:
            related_to_content_ids_str = ",".join([str(wid) for wid in related_to_content_ids])
        result = web_testapp.get(
            "/api/users/1/messages/summary?related_to_content_ids={}".format(
                related_to_content_ids_str
            ),
            status=200,
        ).json_body
        assert result["messages_count"] == nb_messages

    @pytest.mark.parametrize(
        "workspace_ids, nb_messages", [([], 3), ([1, 2], 2), ([1], 1), ([2], 1)]
    )
    def test_api__messages_summary__ok_200__workspace_filter(
        self, session, web_testapp, workspace_ids, nb_messages
    ) -> None:
        create_space_messages(session, sent_date=datetime.datetime.utcnow())
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        if not workspace_ids:
            workspace_ids_str = ""
        else:
            workspace_ids_str = ",".join([str(wid) for wid in workspace_ids])
        result = web_testapp.get(
            "/api/users/1/messages/summary?workspace_ids={}".format(workspace_ids_str), status=200,
        ).json_body
        assert result["messages_count"] == nb_messages

    def test_api__messages_summary__err_400__invalid_event_type_filter(
        self, session, web_testapp,
    ) -> None:
        """
        Check invalid event type case for summary
        """

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.get(
            "/api/users/1/messages/summary?include_event_types=unknown", status=400,
        ).json_body
        assert result["code"] == 2001
        assert result["message"] == "Validation error of input data"

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.get(
            "/api/users/1/messages/summary?exclude_event_types=unknown", status=400,
        ).json_body
        assert result["code"] == 2001
        assert result["message"] == "Validation error of input data"
