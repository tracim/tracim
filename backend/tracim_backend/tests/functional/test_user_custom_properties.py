# -*- coding: utf-8 -*-
"""
Tests for endpoints related to user custom properties
"""

import json
import typing

import pytest
import transaction
from webtest import TestApp

from tracim_backend.error import ErrorCode
from tracim_backend.models.auth import Profile
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import UserApiFactory


@pytest.mark.parametrize(
    "config_section", [{"name": "custom_properties_sample_test"}], indirect=True
)
@pytest.mark.usefixtures("base_fixture")
class TestUserCustomProperties(object):
    """
    Tests for GET and PUT /api/users/{user_id}/custom-properties
    """

    def test__get_user_custom_properties_endpoint_new_user(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp
    ):
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )
        transaction.commit()
        user_id = test_user.user_id
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get(
            "/api/users/{user_id}/custom-properties".format(user_id=user_id), status=200
        )

        assert json.loads(res.body)["parameters"] == {}

    def test__put_user_custom_properties_endpoint(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp
    ):
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )

        transaction.commit()

        fixture_params = {
            "fields": {
                "subfield5": ["first", "second"],
                "subfield3": True,
                "subfield4": None,
                "subfield2": 3,
                "subfield1": "text",
            },
            "date": "2021-01-13",
            "custom": "toto",
        }

        user_id = test_user.user_id
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        web_testapp.put_json(
            "/api/users/{user_id}/custom-properties".format(user_id=user_id),
            params={"parameters": fixture_params},
            status=204,
        )

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get(
            "/api/users/{user_id}/custom-properties".format(user_id=user_id), status=200
        )

        assert json.loads(res.body)["parameters"] == fixture_params
        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get(
            "/api/users/{user_id}/custom-properties".format(user_id=user_id), status=200
        )
        assert json.loads(res.body)["parameters"] == fixture_params

    @pytest.mark.parametrize(
        "user_custom_properties",
        [
            {"fields": {"subfield3": 401}},
            {"fields": {"subfield5": ["first", "second", "invalid_enum"]}},
        ],
    )
    def test__put_user_custom_properties_endpoint__error__400__invalid_format(
        self,
        user_api_factory: UserApiFactory,
        web_testapp: TestApp,
        user_custom_properties: typing.Dict,
    ):
        uapi = user_api_factory.get()
        profile = Profile.USER
        test_user = uapi.create_user(
            email="test@test.test",
            password="password",
            name="bob",
            profile=profile,
            timezone="Europe/Paris",
            lang="fr",
            do_save=True,
            do_notify=False,
        )

        transaction.commit()

        user_id = test_user.user_id
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        response = web_testapp.put_json(
            "/api/users/{user_id}/custom-properties".format(user_id=user_id),
            params={"parameters": user_custom_properties},
            status=400,
        ).json_body
        assert response["code"] == ErrorCode.INTERNAL_TRACIM_VALIDATION_ERROR
        assert response["message"]
