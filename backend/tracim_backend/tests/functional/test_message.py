# -*- coding: utf-8 -*-
import datetime

import pytest
import transaction

from tracim_backend.lib.utils.utils import DATETIME_FORMAT
import tracim_backend.models.event as tracim_event
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


def create_events_and_messages(session) -> tracim_event.Event:
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
        messages.append(
            tracim_event.Message(event=event, receiver_id=1, read=datetime.datetime.utcnow())
        )

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
        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status={}".format(read_status), status=200,
        ).json_body
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
        message_dicts = web_testapp.get(
            "/api/users/1/messages?event_types={}".format(event_type), status=200,
        ).json_body
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
    def test_api__get_messages__ok_400__invalid_event_type_filter(
        self, session, web_testapp, event_type: str
    ) -> None:
        """
        Check invalid event type case
        """
        messages = create_events_and_messages(session)

        if event_type:
            messages = [m for m in messages if m.event_type == event_type]

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        message_dicts = web_testapp.get(
            "/api/users/1/messages?event_types={}".format(event_type), status=400,
        ).json_body
        assert message_dicts["code"] == 2001
        assert message_dicts["message"] == "Validation error of input data"

    def test_api__get_messages__ok_200__paginate_result(self, session, web_testapp,) -> None:
        """
        Get messages through the classic HTTP endpoint.
        Paginate with both "count" and "before_event_id"
        """
        messages = create_events_and_messages(session)
        assert len(messages) == 2
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        message_dicts_0 = web_testapp.get("/api/users/1/messages", status=200,).json_body
        message_dicts_1 = web_testapp.get("/api/users/1/messages?count=10", status=200,).json_body
        message_dicts_2 = web_testapp.get("/api/users/1/messages?count=2", status=200,).json_body
        assert message_dicts_0 == message_dicts_1 == message_dicts_2
        assert len(message_dicts_0) == 2
        assert message_dicts_0[0]["event_id"] == 2
        assert message_dicts_0[1]["event_id"] == 1

        message_dicts = web_testapp.get("/api/users/1/messages?count=1", status=200,).json_body
        assert message_dicts
        assert len(message_dicts) == 1
        assert message_dicts_0[0]["event_id"] == 2

        message_dicts_0 = web_testapp.get(
            "/api/users/1/messages?before_event_id=2", status=200,
        ).json_body
        message_dicts_1 = web_testapp.get(
            "/api/users/1/messages?count=10&before_event_id=2", status=200,
        ).json_body
        message_dicts_2 = web_testapp.get(
            "/api/users/1/messages?count=2&before_event_id=2", status=200,
        ).json_body
        message_dicts_3 = web_testapp.get(
            "/api/users/1/messages?count=1&before_event_id=2", status=200,
        ).json_body
        assert message_dicts_0 == message_dicts_1 == message_dicts_2 == message_dicts_3
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

    @pytest.mark.parametrize("before_event_id", [-100, -1, 0])
    def test_api__get_messages__ok_400__invalid_before_event_id(
        self, session, web_testapp, before_event_id
    ) -> None:
        """
        Check invalid before_event_id value
        """
        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))
        message_dicts = web_testapp.get(
            "/api/users/1/messages?before_event_id={}".format(before_event_id), status=400,
        ).json_body
        assert message_dicts["code"] == 2001
        assert message_dicts["message"] == "Validation error of input data"
