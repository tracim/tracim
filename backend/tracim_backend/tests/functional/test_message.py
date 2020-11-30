# -*- coding: utf-8 -*-
import datetime
import typing

import pytest
import transaction

from tracim_backend.lib.utils.utils import DATETIME_FORMAT
import tracim_backend.models.event as tracim_event
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


def create_events_and_messages(
    session, unread: bool = False, sent_date: typing.Optional[datetime.datetime] = None
) -> typing.List[tracim_event.Message]:
    messages = []
    with transaction.manager:
        # remove messages created by the base fixture
        session.query(tracim_event.Message).delete()
        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.USER,
            operation=tracim_event.OperationType.CREATED,
            fields={"example": "hello", "author": {"user_id": 1}},
        )
        session.add(event)
        read_datetime = datetime.datetime.utcnow()
        if unread:
            read_datetime = None
        messages.append(
            tracim_event.Message(event=event, receiver_id=1, read=read_datetime, sent=sent_date)
        )

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.USER,
            operation=tracim_event.OperationType.MODIFIED,
            fields={"example": "bar", "author": {"user_id": 2}},
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


def create_workspace_messages(
    session, unread: bool = False, sent_date: typing.Optional[datetime.datetime] = None
) -> typing.List[tracim_event.Message]:
    messages = []
    with transaction.manager:
        # remove messages created by the base fixture
        session.query(tracim_event.Message).delete()
        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.WORKSPACE,
            operation=tracim_event.OperationType.CREATED,
            fields={"author": {"user_id": 1}, "workspace": {"workspace_id": 1}},
        )
        session.add(event)
        read_datetime = datetime.datetime.utcnow()
        if unread:
            read_datetime = None
        messages.append(
            tracim_event.Message(event=event, receiver_id=1, read=read_datetime, sent=sent_date)
        )

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.WORKSPACE_MEMBER,
            operation=tracim_event.OperationType.MODIFIED,
            fields={"author": {"user_id": 2}, "workspace": {"workspace_id": 2}},
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
        messages = create_events_and_messages(session, sent_date=datetime.datetime.utcnow())
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
        messages = create_events_and_messages(session, sent_date=None)
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
        messages = create_events_and_messages(session, sent_date=datetime.datetime.utcnow())

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
        messages = create_events_and_messages(session, sent_date=datetime.datetime.utcnow())

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

    @pytest.mark.parametrize("workspace_ids", [[], [1, 2], [1], [2]])
    def test_api__get_messages__ok_200__workspace_filter(
        self, session, web_testapp, workspace_ids
    ) -> None:
        """
        Get messages through the classic HTTP endpoint. Filter by event_type
        """
        messages = create_workspace_messages(session, sent_date=datetime.datetime.utcnow())
        if workspace_ids:
            new_messages = []
            for m in messages:
                if m.event.fields.get("workspace"):
                    if m.event.workspace["workspace_id"] in workspace_ids:
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

    @pytest.mark.parametrize(
        "event_type",
        ["user", "user.modified.subtype.subsubtype", "user.donothing", "nothing.deleted"],
    )
    def test_api__get_messages__err_400__invalid_event_type_filter(
        self, session, web_testapp, event_type: str
    ) -> None:
        """
        Check invalid event type case
        """
        messages = create_events_and_messages(session, sent_date=datetime.datetime.utcnow())

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
        messages = create_events_and_messages(session, sent_date=datetime.datetime.utcnow())
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

    def test_api__read_all_messages__ok_204__nominal_case(self, session, web_testapp) -> None:
        """
        Read all unread messages
        """
        messages = create_events_and_messages(
            session, unread=True, sent_date=datetime.datetime.utcnow()
        )

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 3

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 0

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(messages) == len(message_dicts) == 3
        for message, message_dict in zip(messages, message_dicts):
            assert not message_dict["read"]

        web_testapp.put("/api/users/1/messages/read", status=204)
        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(message_dicts) == 3
        for message, message_dict in zip(messages, message_dicts):
            assert message_dict["read"]

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 0

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 3

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

    def test_api__read_message__ok_204__nominal_case(self, session, web_testapp) -> None:
        """
        Read one unread message
        """
        messages = create_events_and_messages(session, sent_date=datetime.datetime.utcnow())

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(messages) == len(message_dicts) == 3

        unread_event_id = None
        for message, message_dict in zip(messages, message_dicts):
            if not message_dict.get("read"):
                unread_event_id = message.event_id

        assert unread_event_id
        message_dicts = web_testapp.put(
            "/api/users/1/messages/{}/read".format(unread_event_id), status=204,
        )

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(message_dicts) == 3

        for message, message_dict in zip(messages, message_dicts):
            if message_dict["event_id"] == unread_event_id:
                assert message_dict["read"]

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 1

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 2

    def test_api__read_message__ok_204__read_only_one_message(self, session, web_testapp) -> None:
        """
        Read one unread message, check if only one message as been read
        """
        create_events_and_messages(session, unread=True, sent_date=datetime.datetime.utcnow())

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 3

        message_dicts = web_testapp.put("/api/users/1/messages/2/read", status=204,)

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 2
        assert message_dicts[0]["event_id"] == 4
        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 1
        assert message_dicts[0]["event_id"] == 2

    def test_api__unread_message__ok_204__nominal_case(self, session, web_testapp) -> None:
        """
        Read one unread message
        """
        messages = create_events_and_messages(session, sent_date=datetime.datetime.utcnow())

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(messages) == len(message_dicts) == 3

        read_event_id = None
        for message, message_dict in zip(messages, message_dicts):
            if message_dict.get("read"):
                read_event_id = message.event_id

        assert read_event_id
        message_dicts = web_testapp.put(
            "/api/users/1/messages/{}/unread".format(read_event_id), status=204,
        )

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(message_dicts) == 3
        for message, message_dict in zip(messages, message_dicts):
            assert not message_dict["read"]

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 3

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 0

    def test_api__messages_summary__ok_200__nominal_case(self, session, web_testapp) -> None:
        """
        check summary of messages
        """
        create_events_and_messages(session, sent_date=datetime.datetime.utcnow())

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get("/api/users/1/messages/summary", status=200,).json_body
        assert message_dicts["user_id"] == 1
        assert message_dicts["unread_messages_count"] == 2
        assert message_dicts["read_messages_count"] == 1
        assert message_dicts["messages_count"] == 3
        assert message_dicts["user"]["user_id"] == 1
        assert message_dicts["user"]["username"] == "TheAdmin"

    @pytest.mark.parametrize(
        "include_exclude,event_types,read_messages_count,unread_messages_count",
        [
            ("include", ["user.created", "user.modified"], 1, 2),
            ("include", ["user.created"], 1, 0),
            ("include", ["user.modified"], 0, 2),
            ("exclude", ["user.created", "user.modified"], 0, 0),
            ("exclude", ["user.created"], 0, 2),
            ("exclude", ["user.modified"], 1, 0),
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
        create_events_and_messages(session, sent_date=datetime.datetime.utcnow())

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
