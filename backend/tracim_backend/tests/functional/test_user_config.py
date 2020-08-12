# -*- coding: utf-8 -*-
"""
Tests for /api/users subpath endpoints.
"""

import json

import pytest
import transaction
from webtest import TestApp

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

    def test__post_user_config_endpoint_with_update(
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
        web_testapp.post_json(
            "/api/users/{user_id}/config".format(user_id=user_id),
            params={"parameters": fixture_params1},
            status=204,
        )

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get("/api/users/{user_id}/config".format(user_id=user_id), status=200)

        assert json.loads(res.body, encoding="utf-8")["parameters"] == fixture_params1

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        web_testapp.post_json(
            "/api/users/{user_id}/config".format(user_id=user_id),
            params={"parameters": fixture_params2},
            status=204,
        )

        transaction.commit()

        web_testapp.authorization = ("Basic", ("test@test.test", "password"))
        res = web_testapp.get("/api/users/{user_id}/config".format(user_id=user_id), status=200)

        assert json.loads(res.body, encoding="utf-8")["parameters"] == expected_result
