# coding=utf-8
import pytest

from tracim_backend.exceptions import ProfileDoesNotExist
from tracim_backend.models.auth import Profile


class TestProfile(object):
    """
    Test for Profile Enum Object
    """

    def test_profile__ok__all_list(self):
        profiles = list(Profile)
        assert len(profiles) == 4
        for profile in profiles:
            assert profile
            assert profile.slug
            assert isinstance(profile.slug, str)
            assert profile.id or profile.id == 0
        assert Profile["ADMIN"]
        assert Profile["USER"]
        assert Profile["TRUSTED_USER"]

    def test_profile__ok__get_profile_slugs__ok__nominal_case(self):
        profile_slugs = Profile.get_all_valid_slugs()
        assert set(profile_slugs) == {"administrators", "users", "trusted-users"}

    def test_profile__ok__get_profile__from_slug__ok__nominal_case(self):
        profile = Profile.get_profile_from_slug("administrators")

        assert profile
        assert profile.slug
        assert isinstance(profile.slug, str)
        assert profile.id > 0
        assert isinstance(profile.id, int)

    def test_profile__ok__get_role__from_id__err__profile_does_not_exist(self):
        with pytest.raises(ProfileDoesNotExist):
            Profile.get_profile_from_id(-1000)

    def test_profile__ok__get_role__from_slug__err__profile_does_not_exist(self):
        with pytest.raises(ProfileDoesNotExist):
            Profile.get_profile_from_slug("this slug does not exist")
