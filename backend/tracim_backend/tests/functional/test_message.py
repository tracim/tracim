# -*- coding: utf-8 -*-
import datetime

import pytest
import transaction

from tracim_backend.lib.utils.utils import DATETIME_FORMAT
import tracim_backend.models.event as tracim_event
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


def create_events_and_messages(session, unread: bool = False) -> tracim_event.Event:
    messages = []
    with transaction.manager:
        # remove messages created by the base fixture
        session.query(tracim_event.Message).delete()
        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.USER,
            operation=tracim_event.OperationType.CREATED,
            fields={"example": "hello"},
        )
        session.add(event)
        read_datetime = datetime.datetime.utcnow()
        if unread:
            read_datetime = None
        messages.append(tracim_event.Message(event=event, receiver_id=1, read=read_datetime))

        event = tracim_event.Event(
            entity_type=tracim_event.EntityType.USER,
            operation=tracim_event.OperationType.MODIFIED,
            fields={"example": "bar"},
        )
        session.add(event)
        messages.append(tracim_event.Message(event=event, receiver_id=1))
        session.add_all(messages)
        session.flush()
    transaction.commit()
    messages.reverse()
    return messages


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestMessages(object):
    """
    Tests for /api/users/{user_id}/messages
    endpoint
    """

    @pytest.mark.parametrize("read_status", ["all", "read", "unread"])
    def test_api__get_messages__ok_200__nominal_case(
        self, session, web_testapp, read_status: str
    ) -> None:
        """
        Get messages through the classic HTTP endpoint.
        """
        messages = create_events_and_messages(session)
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

    @pytest.mark.parametrize("event_type", ["user.created", "user.modified", ""])
    def test_api__get_messages__ok_200__event_type_filter(
        self, session, web_testapp, event_type: str
    ) -> None:
        """
        Get messages through the classic HTTP endpoint. Filter by event_type
        """
        messages = create_events_and_messages(session)

        if event_type:
            messages = [m for m in messages if m.event_type == event_type]

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.get(
            "/api/users/1/messages?event_types={}".format(event_type), status=200,
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
        messages = create_events_and_messages(session)

        if event_type:
            messages = [m for m in messages if m.event_type == event_type]

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        result = web_testapp.get(
            "/api/users/1/messages?event_types={}".format(event_type), status=400,
        ).json_body
        assert result["code"] == 2001
        assert result["message"] == "Validation error of input data"

    def test_api__get_messages__ok_200__paginate_result(self, session, web_testapp,) -> None:
        """
        Get messages through the classic HTTP endpoint.
        Paginate with both "count" and "before_event_id"
        """
        messages = create_events_and_messages(session)
        assert len(messages) == 2
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        message_dicts_0 = web_testapp.get("/api/users/1/messages", status=200,).json_body.get(
            "items"
        )
        message_dicts_1 = web_testapp.get(
            "/api/users/1/messages?count=10", status=200,
        ).json_body.get("items")
        message_dicts_2 = web_testapp.get(
            "/api/users/1/messages?count=2", status=200,
        ).json_body.get("items")
        assert message_dicts_0 == message_dicts_1 == message_dicts_2
        assert len(message_dicts_0) == 2
        assert message_dicts_0[0]["event_id"] == 2
        assert message_dicts_0[1]["event_id"] == 1

        result = web_testapp.get("/api/users/1/messages?count=1", status=200,).json_body
        message_dicts = result.get("items")
        assert message_dicts
        assert len(message_dicts) == 1
        assert message_dicts_0[0]["event_id"] == 2

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
            "/api/users/1/messages?count=2&page_token={}".format(next_page), status=200,
        ).json_body.get("items")
        message_dicts_3 = web_testapp.get(
            "/api/users/1/messages?count=1&page_token={}".format(next_page), status=200,
        ).json_body.get("items")
        assert message_dicts_0 == message_dicts_1
        assert message_dicts_0 == message_dicts_2
        assert message_dicts_2 == message_dicts_3
        assert len(message_dicts_0) == 1
        assert message_dicts_0[0]["event_id"] == 1

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
        messages = create_events_and_messages(session, unread=True)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 2

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 0

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(messages) == len(message_dicts) == 2
        for message, message_dict in zip(messages, message_dicts):
            assert not message_dict["read"]

        web_testapp.put("/api/users/1/messages/read", status=204)
        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(message_dicts) == 2
        for message, message_dict in zip(messages, message_dicts):
            assert message_dict["read"]

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 0

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 2

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
        messages = create_events_and_messages(session)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(messages) == len(message_dicts) == 2

        unread_event_id = None
        for message, message_dict in zip(messages, message_dicts):
            if not message_dict.get("read"):
                unread_event_id = message.event_id

        assert unread_event_id
        message_dicts = web_testapp.put(
            "/api/users/1/messages/{}/read".format(unread_event_id), status=204,
        )

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(message_dicts) == 2
        for message, message_dict in zip(messages, message_dicts):
            assert message_dict["read"]

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 0

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 2

    def test_api__read_message__ok_204__read_only_one_message(self, session, web_testapp) -> None:
        """
        Read one unread message, check if only one message as been read
        """
        create_events_and_messages(session, unread=True)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 2

        message_dicts = web_testapp.put("/api/users/1/messages/{}/read".format(1), status=204,)

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 1
        assert message_dicts[0]["event_id"] == 2
        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 1
        assert message_dicts[0]["event_id"] == 1

    def test_api__unread_message__ok_204__nominal_case(self, session, web_testapp) -> None:
        """
        Read one unread message
        """
        messages = create_events_and_messages(session)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(messages) == len(message_dicts) == 2

        read_event_id = None
        for message, message_dict in zip(messages, message_dicts):
            if message_dict.get("read"):
                read_event_id = message.event_id

        assert read_event_id
        message_dicts = web_testapp.put(
            "/api/users/1/messages/{}/unread".format(read_event_id), status=204,
        )

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body.get("items")
        assert len(message_dicts) == 2
        for message, message_dict in zip(messages, message_dicts):
            assert not message_dict["read"]

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 2

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body.get("items")
        assert len(message_dicts) == 0

    def test_api__messages_summary__ok_200__nominal_case(self, session, web_testapp) -> None:
        """
        check summary of messages
        """
        create_events_and_messages(session)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get("/api/users/1/messages/summary", status=200,).json_body
        assert message_dicts["user_id"] == 1
        assert message_dicts["unread_messages_count"] == 1
        assert message_dicts["read_messages_count"] == 1
        assert message_dicts["messages_count"] == 2
        assert message_dicts["user"]["user_id"] == 1
        assert message_dicts["user"]["username"] == "TheAdmin"

    @pytest.mark.parametrize(
        "event_types,read_messages_count,unread_messages_count",
        [
            (["user.created", "user.modified"], 1, 1),
            (["user.created"], 1, 0),
            (["user.modified"], 0, 1),
        ],
    )
    def test_api__messages_summary__ok_200__filter_all(
        self, session, web_testapp, event_types, read_messages_count, unread_messages_count
    ) -> None:
        """
        check summary of messages
        """
        create_events_and_messages(session)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        event_type_filter = ",".join(event_types)
        message_dicts = web_testapp.get(
            "/api/users/1/messages/summary?event_types={}".format(event_type_filter), status=200,
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
            "/api/users/1/messages/summary?event_types=unknown", status=400,
        ).json_body
        assert result["code"] == 2001
        assert result["message"] == "Validation error of input data"
