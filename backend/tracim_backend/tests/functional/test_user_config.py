# -*- coding: utf-8 -*-
"""
Tests for /api/users subpath endpoints.
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


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.parametrize("config_section", [{"name": "functional_test"}], indirect=True)
class TestUserConfigEndpoint(object):
    """
    Tests for GET and PUT /api/users/{user_id}/config
    """

    def test__get_user_config_endpoint_new_user(
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
        res = web_testapp.get("/api/users/{user_id}/config".format(user_id=user_id), status=200)

        assert json.loads(res.body, encoding="utf-8")["parameters"] == {}

    def test__put_user_config_endpoint_with_update(
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

        fixture_params1 = {"param1": 1, "param2": "two"}
        fixture_params2 = {"param2": 2, "param3": "hello"}
        expected_result = {"param1": 1, "param2": 2, "param3": "hello"}

        user_id = test_user.user_id
        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        web_testapp.put_json(
            "/api/users/{user_id}/config".format(user_id=user_id),
            params={"parameters": fixture_params1},
            status=204,
        )

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get("/api/users/{user_id}/config".format(user_id=user_id), status=200)

        assert json.loads(res.body, encoding="utf-8")["parameters"] == fixture_params1

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        web_testapp.put_json(
            "/api/users/{user_id}/config".format(user_id=user_id),
            params={"parameters": fixture_params2},
            status=204,
        )

        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get("/api/users/{user_id}/config".format(user_id=user_id), status=200)

        assert json.loads(res.body, encoding="utf-8")["parameters"] == expected_result

    @pytest.mark.parametrize(
        "user_config",
        [{"@": "coucou"}, {"": "coucou"}, {"param1": {"a": "b"}}, {"param2": ["b"]}, ["super"]],
    )
    def test__put_user_config_endpoint__error__400__invalid_format(
        self, user_api_factory: UserApiFactory, web_testapp: TestApp, user_config: typing.Dict
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
            "/api/users/{user_id}/config".format(user_id=user_id),
            params={"parameters": user_config},
            status=400,
        ).json_body
        assert response["code"] == ErrorCode.GENERIC_SCHEMA_VALIDATION_ERROR
        assert response["message"] == "Validation error of input data"
