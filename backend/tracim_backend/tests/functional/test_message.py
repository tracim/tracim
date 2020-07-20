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

    def test_api__read_all_messages__ok_204__nominal_case(self, session, web_testapp) -> None:
        """
        Read all unread messages
        """
        messages = create_events_and_messages(session, unread=True)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body
        assert len(message_dicts) == 2

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body
        assert len(message_dicts) == 0

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body
        assert len(messages) == len(message_dicts) == 2
        for message, message_dict in zip(messages, message_dicts):
            assert not message_dict["read"]

        message_dicts = web_testapp.put("/api/users/1/messages/read", status=204,)
        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body
        assert len(message_dicts) == 2
        for message, message_dict in zip(messages, message_dicts):
            assert message_dict["read"]

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body
        assert len(message_dicts) == 0

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body
        assert len(message_dicts) == 2

    def test_api__read_message__ok_204__nominal_case(self, session, web_testapp) -> None:
        """
        Read one unread message
        """
        messages = create_events_and_messages(session)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body
        assert len(messages) == len(message_dicts) == 2

        unread_event_id = None
        for message, message_dict in zip(messages, message_dicts):
            if not message_dict.get("read"):
                unread_event_id = message.event_id

        assert unread_event_id
        message_dicts = web_testapp.put(
            "/api/users/1/messages/{}/read".format(unread_event_id), status=204,
        )

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body
        assert len(message_dicts) == 2
        for message, message_dict in zip(messages, message_dicts):
            assert message_dict["read"]

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body
        assert len(message_dicts) == 0

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body
        assert len(message_dicts) == 2

    def test_api__read_message__ok_204__read_only_one_message(self, session, web_testapp) -> None:
        """
        Read one unread message, check if only one message as been read
        """
        create_events_and_messages(session, unread=True)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body
        assert len(message_dicts) == 2

        message_dicts = web_testapp.put("/api/users/1/messages/{}/read".format(1), status=204,)

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body
        assert len(message_dicts) == 1
        assert message_dicts[0]["event_id"] == 2
        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body
        assert len(message_dicts) == 1
        assert message_dicts[0]["event_id"] == 1

    def test_api__unread_message__ok_204__nominal_case(self, session, web_testapp) -> None:
        """
        Read one unread message
        """
        messages = create_events_and_messages(session)

        web_testapp.authorization = ("Basic", ("admin@admin.admin", "admin@admin.admin"))

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body
        assert len(messages) == len(message_dicts) == 2

        read_event_id = None
        for message, message_dict in zip(messages, message_dicts):
            if message_dict.get("read"):
                read_event_id = message.event_id

        assert read_event_id
        message_dicts = web_testapp.put(
            "/api/users/1/messages/{}/unread".format(read_event_id), status=204,
        )

        message_dicts = web_testapp.get("/api/users/1/messages", status=200,).json_body
        assert len(message_dicts) == 2
        for message, message_dict in zip(messages, message_dicts):
            assert not message_dict["read"]

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=unread", status=200,
        ).json_body
        assert len(message_dicts) == 2

        message_dicts = web_testapp.get(
            "/api/users/1/messages?read_status=read", status=200,
        ).json_body
        assert len(message_dicts) == 0
