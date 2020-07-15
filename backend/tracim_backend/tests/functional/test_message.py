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
