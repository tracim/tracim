# -*- coding: utf-8 -*-
import typing

import pytest
import transaction

from tracim_backend.app_models.contents import ContentTypeInContext
from tracim_backend.exceptions import ContentFilenameAlreadyUsedInFolder
from tracim_backend.exceptions import ContentInNotEditableState
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.exceptions import SameValueError
from tracim_backend.exceptions import UnallowedSubContent
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.content import compare_content_for_sorting_by_type_and_name
from tracim_backend.models.auth import Profile
from tracim_backend.models.auth import User
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.tests.fixtures import *  # noqa F403,F401
from tracim_backend.tests.utils import eq_


class TestSortContentApi(object):
    def test_compare_content_for_sorting_by_type(self, content_type_list, app_config):
        c1 = Content()
        c1.label = ""
        c1.type = "file"

        c2 = Content()
        c2.label = ""
        c2.type = "folder"

        c11 = c1

        assert 1 == compare_content_for_sorting_by_type_and_name(c1, c2)
        assert -1 == compare_content_for_sorting_by_type_and_name(c2, c1)
        assert 0 == compare_content_for_sorting_by_type_and_name(c1, c11)

    def test_compare_content_for_sorting_by_label(self):
        c1 = Content()
        c1.label = "bbb"
        c1.type = "file"

        c2 = Content()
        c2.label = "aaa"
        c2.type = "file"

        c11 = c1

        assert 1 == compare_content_for_sorting_by_type_and_name(c1, c2)
        assert -1 == compare_content_for_sorting_by_type_and_name(c2, c1)
        assert 0 == compare_content_for_sorting_by_type_and_name(c1, c11)

    def test_sort_by_label_or_filename(self):
        c1 = Content()
        c1.label = "ABCD"
        c1.type = "file"

        c2 = Content()
        c2.label = ""
        c2.type = "file"
        c2.file_name = "AABC"

        c3 = Content()
        c3.label = "BCDE"
        c3.type = "file"

        items = [c1, c2, c3]
        sorteds = ContentApi.sort_content(items)

        assert sorteds[0] == c2
        assert sorteds[1] == c1
        assert sorteds[2] == c3

    def test_sort_by_content_type(self):
        c1 = Content()
        c1.label = "AAAA"
        c1.type = "file"

        c2 = Content()
        c2.label = "BBBB"
        c2.type = "folder"

        items = [c1, c2]
        sorteds = ContentApi.sort_content(items)

        assert sorteds[0] == c2
        assert sorteds[1] == c1


@pytest.mark.usefixtures("base_fixture")
class TestContentApi(object):
    def test_unit__create_content__OK_nominal_case(
        self,
        user_api_factory,
        workspace_api_factory,
        admin_user,
        session,
        app_config,
        content_type_list,
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        item = api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="not_deleted",
            do_save=True,
        )
        assert isinstance(item, Content)

    def test_unit__create_content__err_empty_label(
        self, user_api_factory, session, app_config, workspace_api_factory, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace = workspace_api_factory.get(user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        with pytest.raises(EmptyLabelNotAllowed):
            api.create(
                content_type_slug=content_type_list.Thread.slug,
                workspace=workspace,
                parent=None,
                label="",
                do_save=True,
            )

    def test_unit__create_content__err_content_type_not_allowed_in_this_folder(
        self, user_api_factory, session, app_config, workspace_api_factory, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace = workspace_api_factory.get(user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        folder = api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="plop",
            do_save=False,
        )
        allowed_content_dict = {
            content_type_list.Folder.slug: True,
            content_type_list.File.slug: False,
        }
        api._set_allowed_content(folder, allowed_content_dict=allowed_content_dict)
        api.save(content=folder)

        # in list but false -> do not allow
        with pytest.raises(UnallowedSubContent):
            api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=folder,
                label="lapin",
                do_save=True,
            )
        # in list and true -> allow
        api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=folder,
            label="lapin",
            do_save=True,
        )

    def test_unit__create_content__err_same_label_as_another_content(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()
        profile = Profile.ADMIN
        user = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=None,
            label="file",
            do_save=True,
        )
        with pytest.raises(ContentFilenameAlreadyUsedInFolder):
            api.create(
                content_type_slug=content_type_list.Page.slug,
                workspace=workspace,
                parent=None,
                label="file",
                do_save=True,
            )

    def test_unit__is_filename_available__ok__nominal_case(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.CONTENT
            )
            is True
        )
        content = Content()
        content.label = "test"
        content.owner = user
        content.parent = None
        content.workspace = workspace
        content.type = content_type_list.Page.slug
        content.revision_type = ActionDescription.CREATION
        session.add(content)
        api.save(content, ActionDescription.CREATION, do_notify=False)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.CONTENT
            )
            is False
        )
        content = Content()
        content.label = "test"
        content.owner = user
        content.parent = None
        content.workspace = workspace
        content.type = content_type_list.Page.slug
        content.revision_type = ActionDescription.CREATION
        session.add(content)
        api.save(content, ActionDescription.CREATION, do_notify=False)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.CONTENT
            )
            is False
        )

    def test_unit__is_filename_available__ok__different_namespace(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.UPLOAD
            )
            is True
        )
        content = Content()
        content.label = "test"
        content.owner = user
        content.parent = None
        content.workspace = workspace
        content.content_namespace = ContentNamespaces.CONTENT
        content.type = content_type_list.Page.slug
        content.revision_type = ActionDescription.CREATION
        session.add(content)
        api.save(content, ActionDescription.CREATION, do_notify=False)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.UPLOAD
            )
            is True
        )

    def test_unit__is_filename_available__ok__different_workspace(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(user).create_workspace(
            "test workspace", save_now=True
        )
        workspace2 = workspace_api_factory.get(user).create_workspace(
            "test workspace2", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.CONTENT
            )
            is True
        )
        content = Content()
        content.label = "test"
        content.owner = user
        content.parent = None
        content.workspace = workspace2
        content.type = content_type_list.Page.slug
        content.revision_type = ActionDescription.CREATION
        session.add(content)
        api.save(content, ActionDescription.CREATION, do_notify=False)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.CONTENT
            )
            is True
        )

    def test_unit__is_filename_available__ok__different_parent(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace2", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        folder = Content()
        folder.label = "folder"
        folder.owner = user
        folder.parent = None
        folder.workspace = workspace
        folder.type = content_type_list.Folder.slug
        folder.revision_type = ActionDescription.CREATION
        session.add(folder)
        folder2 = Content()
        folder2.label = "folder2"
        folder2.owner = user
        folder2.parent = None
        folder2.workspace = workspace
        folder2.type = content_type_list.Folder.slug
        folder2.revision_type = ActionDescription.CREATION
        session.add(folder)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.CONTENT
            )
            is True
        )
        content = Content()
        content.label = "test"
        content.owner = user
        content.parent = folder
        content.workspace = workspace
        content.type = content_type_list.Page.slug
        content.revision_type = ActionDescription.CREATION
        session.add(content)
        api.save(content, ActionDescription.CREATION, do_notify=False)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.CONTENT
            )
            is True
        )
        content = Content()
        content.label = "test"
        content.owner = user
        content.parent = folder2
        content.workspace = workspace
        content.type = content_type_list.Page.slug
        content.revision_type = ActionDescription.CREATION
        session.add(content)
        api.save(content, ActionDescription.CREATION, do_notify=False)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.CONTENT
            )
            is True
        )
        content = Content()
        content.label = "test"
        content.owner = user
        content.parent = None
        content.workspace = workspace
        content.type = content_type_list.Page.slug
        content.revision_type = ActionDescription.CREATION
        session.add(content)
        api.save(content, ActionDescription.CREATION, do_notify=False)
        assert (
            api._is_filename_available(
                "test", workspace, parent=None, content_namespace=ContentNamespaces.CONTENT
            )
            is False
        )

    def test_unit__set_allowed_content__ok__private_method(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        folder = api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="plop",
            do_save=False,
        )
        allowed_content_dict = {
            content_type_list.Folder.slug: True,
            content_type_list.File.slug: False,
        }
        api._set_allowed_content(folder, allowed_content_dict=allowed_content_dict)
        assert "allowed_content" in folder.properties
        assert folder.properties["allowed_content"] == {
            content_type_list.Folder.slug: True,
            content_type_list.File.slug: False,
        }

    def test_unit__set_allowed_content__ok__nominal_case(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        folder = api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="plop",
            do_save=False,
        )
        allowed_content_type_slug_list = [
            content_type_list.Folder.slug,
            content_type_list.File.slug,
        ]
        api.set_allowed_content(
            folder, allowed_content_type_slug_list=allowed_content_type_slug_list
        )
        assert "allowed_content" in folder.properties
        assert folder.properties["allowed_content"] == {
            content_type_list.Folder.slug: True,
            content_type_list.File.slug: True,
        }

    def test_unit__restore_content_default_allowed_content__ok__nominal_case(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        folder = api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="plop",
            do_save=False,
        )
        allowed_content_type_slug_list = [
            content_type_list.Folder.slug,
            content_type_list.File.slug,
        ]
        api.set_allowed_content(
            folder, allowed_content_type_slug_list=allowed_content_type_slug_list
        )
        assert "allowed_content" in folder.properties
        assert folder.properties["allowed_content"] == {
            content_type_list.Folder.slug: True,
            content_type_list.File.slug: True,
        }
        api.restore_content_default_allowed_content(folder)
        assert "allowed_content" in folder.properties
        assert folder.properties[
            "allowed_content"
        ] == content_type_list.default_allowed_content_properties(folder.type)

    def test_unit__get_allowed_content_type__ok__html_document(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        allowed_content_type_dict = {"html-document": True, "file": False}
        allowed_content_types = api._get_allowed_content_type(allowed_content_type_dict)
        assert len(allowed_content_types) == 1
        assert allowed_content_types[0] == content_type_list.get_one_by_slug("html-document")

    def test_unit__get_allowed_content_type__ok__page_legacy_alias(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        allowed_content_type_dict = {"page": True, "file": False}
        allowed_content_types = api._get_allowed_content_type(allowed_content_type_dict)
        assert len(allowed_content_types) == 1
        assert allowed_content_types[0] == content_type_list.get_one_by_slug("html-document")

    def test_unit___check_valid_content_type_in_dir__ok__nominal(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        folder = api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="plop",
            do_save=False,
        )
        allowed_content_type_slug_list = [content_type_list.Folder.slug]
        api.set_allowed_content(
            folder, allowed_content_type_slug_list=allowed_content_type_slug_list
        )
        api._check_valid_content_type_in_dir(
            content_type=content_type_list.Folder, parent=folder, workspace=workspace
        )

    def test_unit___check_valid_content_type_in_dir__err__not_valid_in_folder(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        folder = api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="plop",
            do_save=False,
        )
        allowed_content_type_slug_list = [content_type_list.Folder.slug]
        api.set_allowed_content(
            folder, allowed_content_type_slug_list=allowed_content_type_slug_list
        )
        with pytest.raises(UnallowedSubContent):
            api._check_valid_content_type_in_dir(
                content_type=content_type_list.File, parent=folder, workspace=workspace
            )

    def test_unit___check_valid_content_type_in_dir__err__not_valid_in_workspace(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )

        # INFO - G.M - 2019-01-16 - override get_allowed_content_types methods
        # to allow setting allowed content types of workspaces as tracim doesn't
        # support yet to change this.
        def fake_get_allowed_content_types() -> typing.List[ContentTypeInContext]:
            return [content_type_list.File]

        workspace.get_allowed_content_types = fake_get_allowed_content_types

        api = ContentApi(current_user=user, session=session, config=app_config)
        api._check_valid_content_type_in_dir(
            content_type=content_type_list.File, parent=None, workspace=workspace
        )
        with pytest.raises(UnallowedSubContent):
            api._check_valid_content_type_in_dir(
                content_type=content_type_list.Folder, parent=None, workspace=workspace
            )

    def test_delete(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="not_deleted",
            do_save=True,
        )
        api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="to_delete",
            do_save=True,
        )
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = workspace_api_factory.get(current_user=user)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(current_user=user, session=session, config=app_config)
        items = api.get_all(None, content_type_list.Any_SLUG, workspace)
        eq_(2, len(items))

        items = api.get_all(None, content_type_list.Any_SLUG, workspace)
        with new_revision(session=session, tm=transaction.manager, content=items[0]):
            api.delete(items[0])
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = workspace_api_factory.get(current_user=user)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(current_user=user, session=session, config=app_config)
        items = api.get_all(None, content_type_list.Any_SLUG, workspace)
        eq_(1, len(items))
        transaction.commit()

        # Test that the item is still available if "show deleted" is activated
        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = workspace_api_factory.get(current_user=user)
        api = ContentApi(current_user=user, session=session, config=app_config, show_deleted=True)
        items = api.get_all(None, content_type_list.Any_SLUG, workspace)
        eq_(2, len(items))

    def test_unit__delete__ok__do_not_change_file_extension(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        html_doc = api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=None,
            label="superdoc",
            do_save=True,
        )
        thread = api.create(
            content_type_slug=content_type_list.Thread.slug,
            workspace=workspace,
            parent=None,
            label="superdiscussion",
            do_save=True,
        )
        assert html_doc.label == "superdoc"
        assert html_doc.file_extension == ".document.html"
        assert html_doc.file_name == "superdoc.document.html"

        assert thread.label == "superdiscussion"
        assert thread.file_extension == ".thread.html"
        assert thread.file_name == "superdiscussion.thread.html"

        with new_revision(session=session, tm=transaction.manager, content=html_doc):
            api.delete(html_doc)
        assert html_doc.label != "superdoc"
        assert html_doc.file_extension == ".document.html"

        with new_revision(session=session, tm=transaction.manager, content=thread):
            api.delete(thread)
        assert thread.label != "superdiscussion"
        assert thread.file_extension == ".thread.html"

    def test_unit__archive__ok__do_not_change_file_extension(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        html_doc = api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=None,
            label="superdoc",
            do_save=True,
        )
        thread = api.create(
            content_type_slug=content_type_list.Thread.slug,
            workspace=workspace,
            parent=None,
            label="superdiscussion",
            do_save=True,
        )
        assert html_doc.label == "superdoc"
        assert html_doc.file_extension == ".document.html"
        assert html_doc.file_name == "superdoc.document.html"

        assert thread.label == "superdiscussion"
        assert thread.file_extension == ".thread.html"
        assert thread.file_name == "superdiscussion.thread.html"

        with new_revision(session=session, tm=transaction.manager, content=html_doc):
            api.archive(html_doc)
        assert html_doc.label != "superdoc"
        assert html_doc.file_extension == ".document.html"

        with new_revision(session=session, tm=transaction.manager, content=thread):
            api.archive(thread)
        assert thread.label != "superdiscussion"
        assert thread.file_extension == ".thread.html"

    def test_archive(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace_api = workspace_api_factory.get(current_user=user)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        api = ContentApi(current_user=user, session=session, config=app_config)
        api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="not_archived",
            do_save=True,
        )
        api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="to_archive",
            do_save=True,
        )
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()
        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = workspace_api_factory.get(current_user=user)
        api = ContentApi(session=session, current_user=user, config=app_config)

        items = api.get_all(None, content_type_list.Any_SLUG, workspace)
        eq_(2, len(items))

        items = api.get_all(None, content_type_list.Any_SLUG, workspace)
        with new_revision(session=session, tm=transaction.manager, content=items[0]):
            api.archive(items[0])
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = workspace_api_factory.get(current_user=user)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(current_user=user, session=session, config=app_config)

        items = api.get_all(None, content_type_list.Any_SLUG, workspace)
        eq_(1, len(items))
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = workspace_api_factory.get(current_user=user)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(current_user=user, session=session, config=app_config)

        # Test that the item is still available if "show deleted" is activated
        api = ContentApi(current_user=None, session=session, config=app_config, show_archived=True)
        items = api.get_all(None, content_type_list.Any_SLUG, workspace)
        eq_(2, len(items))

    def test_get_all_with_filter(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )

        api = ContentApi(current_user=user, session=session, config=app_config)
        api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="thefolder",
            do_save=True,
        )
        api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            parent=None,
            label="thefile",
            do_save=True,
        )
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = workspace_api_factory.get(current_user=user)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(current_user=user, session=session, config=app_config)

        items = api.get_all(None, content_type_list.Any_SLUG, workspace)
        eq_(2, len(items))

        items2 = api.get_all(None, content_type_list.File.slug, workspace)
        eq_(1, len(items2))
        eq_("thefile", items2[0].label)

        items3 = api.get_all(None, content_type_list.Folder.slug, workspace)
        eq_(1, len(items3))
        eq_("thefolder", items3[0].label)

    def test_get_all_with_parent_id(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        item = api.create(content_type_list.Folder.slug, workspace, None, "parent", do_save=True)
        item2 = api.create(content_type_list.File.slug, workspace, item, "file1", do_save=True)
        api.create(content_type_list.File.slug, workspace, None, "file2", do_save=True)
        parent_id = item.content_id
        child_id = item2.content_id
        uid = user.user_id
        wid = workspace.workspace_id
        transaction.commit()

        # Refresh instances after commit
        user = uapi.get_one(uid)
        workspace_api = workspace_api_factory.get(current_user=user)
        workspace = workspace_api.get_one(wid)
        api = ContentApi(current_user=user, session=session, config=app_config)

        items = api.get_all(None, content_type_list.Any_SLUG, workspace)
        eq_(3, len(items))

        items2 = api.get_all([parent_id], content_type_list.File.slug, workspace)
        eq_(1, len(items2))
        eq_(child_id, items2[0].content_id)

    def test_set_status_unknown_status(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)

        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        c = api.create(content_type_list.Folder.slug, workspace, None, "parent", "", True)
        with new_revision(session=session, tm=transaction.manager, content=c):
            with pytest.raises(ValueError):
                api.set_status(c, "unknown-status")

    def test_unit__set_status__ok__nominal_case(
        self,
        user_api_factory,
        role_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)
        user2 = uapi.create_minimal_user(email="another@user", profile=Profile.ADMIN, save_now=True)

        workspace = workspace_api_factory.get(current_user=user2).create_workspace(
            "test workspace", save_now=True
        )
        rapi = role_api_factory.get(current_user=user2)
        rapi.create_one(user, workspace, UserRoleInWorkspace.CONTENT_MANAGER, False)
        api2 = ContentApi(current_user=user2, session=session, config=app_config)
        c = api2.create(content_type_list.Folder.slug, workspace, None, "parent", "", True)
        assert c.owner_id == user2.user_id
        assert c.current_revision.owner_id == user2.user_id
        api = ContentApi(current_user=user, session=session, config=app_config)
        with new_revision(session=session, tm=transaction.manager, content=c):
            for new_status in [
                "open",
                "closed-validated",
                "closed-unvalidated",
                "closed-deprecated",
            ]:
                api.set_status(c, new_status)
        api.save(c)

        assert new_status == c.status
        assert ActionDescription.STATUS_UPDATE == c.revision_type
        assert c.current_revision.owner_id == user.user_id

    def test_create_file__ok__another_namespace(
        self,
        content_type_list,
        user_api_factory,
        content_api_factory,
        workspace_api_factory,
        session,
        app_config,
    ):
        uapi = user_api_factory.get()

        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.ADMIN, save_now=True)

        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )

        api = ContentApi(current_user=user, session=session, config=app_config)
        p = api.create(
            content_type_list.Page.slug,
            workspace,
            None,
            "this_is_a_page",
            do_save=True,
            content_namespace=ContentNamespaces.UPLOAD,
        )
        transaction.commit()
        assert p.content_namespace == ContentNamespaces.UPLOAD

    def test_create_comment_ok(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )

        api = ContentApi(current_user=user, session=session, config=app_config)
        p = api.create(content_type_list.Page.slug, workspace, None, "this_is_a_page", do_save=True)
        c = api.create_comment(workspace, p, "this is the comment", True)

        assert Content == c.__class__
        assert p.content_id == c.parent_id
        assert user == c.owner
        assert workspace == c.workspace
        assert content_type_list.Comment.slug == c.type
        assert "this is the comment" == c.raw_content
        assert "" == c.label
        assert "" == c.description
        assert ActionDescription.COMMENT == c.revision_type

    def test_unit_move_file_with_comments__different_parent_same_workspace(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        """
        Check if move of content does proper copy of subcontent.
        """
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        foldera = api.create(content_type_list.Folder.slug, workspace, None, "folder a", "", True)
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=foldera,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")
        api.save(text_file, ActionDescription.CREATION)
        api.create_comment(
            workspace, parent=text_file, content="just a comment", do_save=True, do_notify=False
        )
        folderb = api.create(content_type_list.Folder.slug, workspace, None, "folder b", "", True)
        comment_before_move_id = text_file.children[0].id
        api2 = ContentApi(current_user=user2, session=session, config=app_config)
        with new_revision(content=text_file, tm=transaction.manager, session=session):
            api2.move(item=text_file, new_parent=folderb, new_workspace=text_file.workspace)
            api2.save(text_file)
        transaction.commit()
        text_file_after_move = api2.get_one_by_label_and_parent("test_file", folderb)
        comment_after_move = text_file_after_move.children[0]
        assert text_file == text_file_after_move
        assert comment_before_move_id == comment_after_move.id
        assert text_file_after_move.revision_type == ActionDescription.MOVE
        assert text_file_after_move.current_revision.owner_id == user2.user_id

    def test_unit_move_file_with_comments__different_parent_different_workspace(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        """
        Check if copy of content does proper copy of subcontent.
        """
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        foldera = api.create(content_type_list.Folder.slug, workspace, None, "folder a", "", True)
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=foldera,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")
        api.save(text_file, ActionDescription.CREATION)
        api.create_comment(
            workspace, parent=text_file, content="just a comment", do_save=True, do_notify=False
        )
        comment_before_move_id = text_file.children[0].id
        comment_before_move_workspace_id = text_file.children[0].workspace_id
        assert text_file.children[0].raw_content == "just a comment"
        workspace2 = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace2", save_now=True
        )
        folderb = api.create(content_type_list.Folder.slug, workspace2, None, "folder b", "", True)
        with new_revision(content=text_file, tm=transaction.manager, session=session):
            api.move(
                item=text_file,
                new_parent=folderb,
                new_workspace=workspace2,
                must_stay_in_same_workspace=False,
            )
            api.save(text_file)
        transaction.commit()
        api2 = ContentApi(current_user=user, session=session, config=app_config)
        text_file_after_move = api2.get_one_by_label_and_parent("test_file", folderb)
        assert text_file_after_move.children[0].raw_content == "just a comment"
        assert text_file_after_move.children[0].id == comment_before_move_id
        assert text_file_after_move.children[0].workspace_id != comment_before_move_workspace_id

    def test_unit_move_file_with_comments__different_namespace(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        """
        Check if copy of content does proper copy of subcontent.
        """
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        foldera = api.create(
            content_type_list.Folder.slug,
            workspace,
            None,
            "folder a",
            "",
            True,
            content_namespace=ContentNamespaces.CONTENT,
        )
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=foldera,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")
        api.save(text_file, ActionDescription.CREATION)
        api.create_comment(
            workspace, parent=text_file, content="just a comment", do_save=True, do_notify=False
        )

        comment_before_move_id = text_file.children[0].id
        comment_before_move_workspace_id = text_file.children[0].workspace_id
        assert text_file.content_namespace == ContentNamespaces.CONTENT
        assert text_file.children[0].content_namespace == ContentNamespaces.CONTENT
        assert text_file.children[0].raw_content == "just a comment"
        workspace2 = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace2", save_now=True
        )
        folderb = api.create(
            content_type_list.Folder.slug,
            workspace2,
            None,
            "folder b",
            "",
            True,
            content_namespace=ContentNamespaces.UPLOAD,
        )
        with new_revision(content=text_file, tm=transaction.manager, session=session):
            api.move(
                item=text_file,
                new_parent=folderb,
                new_workspace=workspace2,
                must_stay_in_same_workspace=False,
            )
            api.save(text_file)
        transaction.commit()
        api2 = ContentApi(current_user=user, session=session, config=app_config)
        text_file_after_move = api2.get_one_by_label_and_parent("test_file", folderb)
        assert text_file_after_move.content_namespace == ContentNamespaces.UPLOAD
        assert text_file_after_move.children[0].raw_content == "just a comment"
        assert text_file_after_move.children[0].id == comment_before_move_id
        assert text_file_after_move.children[0].workspace_id != comment_before_move_workspace_id
        assert text_file_after_move.children[0].workspace_id != comment_before_move_workspace_id

    def test_unit_copy_file_different_label_different_parent_ok(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        foldera = api.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace,
            parent=None,
            label="folder a",
            filename="",
            do_save=True,
        )
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=foldera,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")

        api.save(text_file, ActionDescription.CREATION)
        api2 = ContentApi(current_user=user2, session=session, config=app_config)
        workspace2 = workspace_api_factory.get(current_user=user2).create_workspace(
            "test workspace2", save_now=True
        )
        folderb = api2.create(
            content_type_slug=content_type_list.Folder.slug,
            workspace=workspace2,
            parent=None,
            label="folder b",
            filename="",
            do_save=True,
        )

        api2.copy(item=text_file, new_parent=folderb, new_label="test_file_copy")

        transaction.commit()
        text_file_copy = api2.get_one_by_label_and_parent("test_file_copy", folderb)

        assert text_file != text_file_copy
        assert text_file_copy.content_id != text_file.content_id
        assert text_file_copy.workspace_id == workspace2.workspace_id
        assert text_file_copy.depot_file.file.read() == text_file.depot_file.file.read()
        assert text_file_copy.depot_file.path != text_file.depot_file.path
        assert text_file_copy.label == "test_file_copy"
        assert text_file_copy.type == text_file.type
        assert text_file_copy.parent.content_id == folderb.content_id
        assert text_file_copy.owner.user_id == user2.user_id
        assert text_file_copy.current_revision.owner_id == user2.user_id
        assert text_file_copy.description == text_file.description
        assert text_file_copy.file_extension == text_file.file_extension
        assert text_file_copy.file_mimetype == text_file.file_mimetype
        assert text_file_copy.revision_type == ActionDescription.COPY
        assert len(text_file_copy.revisions) == len(text_file.revisions) + 1

    def test_unit_copy_file_same_label_different_namespace(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=None,
                content_namespace=ContentNamespaces.CONTENT,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")

        api.save(text_file, ActionDescription.CREATION)
        api2 = ContentApi(current_user=user2, session=session, config=app_config)

        api2.copy(
            item=text_file,
            new_content_namespace=ContentNamespaces.UPLOAD,
            new_label="test_file_copy",
        )

        transaction.commit()
        text_file_copy = api2.get_one_by_label_and_parent("test_file_copy")

        assert text_file != text_file_copy
        assert text_file_copy.content_id != text_file.content_id
        assert text_file_copy.workspace_id == workspace.workspace_id
        assert text_file_copy.depot_file.file.read() == text_file.depot_file.file.read()
        assert text_file_copy.depot_file.path != text_file.depot_file.path
        assert text_file_copy.label == "test_file_copy"
        assert text_file_copy.type == text_file.type
        assert text_file_copy.content_namespace == ContentNamespaces.UPLOAD
        assert text_file_copy.owner.user_id == user2.user_id
        assert text_file_copy.current_revision.owner_id == user2.user_id
        assert text_file_copy.description == text_file.description
        assert text_file_copy.file_extension == text_file.file_extension
        assert text_file_copy.file_mimetype == text_file.file_mimetype
        assert text_file_copy.revision_type == ActionDescription.COPY
        assert len(text_file_copy.revisions) == len(text_file.revisions) + 1

    def test_unit_copy_file_with_comments_different_label_different_parent_ok(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        """
        Check if copy of content does proper copy of subcontent.
        """
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        foldera = api.create(content_type_list.Folder.slug, workspace, None, "folder a", "", True)
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=foldera,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")
        api.save(text_file, ActionDescription.CREATION)
        api.create_comment(
            workspace, parent=text_file, content="just a comment", do_save=True, do_notify=False
        )
        with new_revision(session, transaction.manager, content=text_file):
            api.update_content(text_file, text_file.label, new_description="just a description")
            api.save(
                content=text_file, action_description=ActionDescription.EDITION, do_notify=False
            )
        api.create_comment(
            workspace,
            parent=text_file,
            content="just another comment",
            do_save=True,
            do_notify=False,
        )
        api2 = ContentApi(current_user=user2, session=session, config=app_config)
        workspace2 = workspace_api_factory.get(current_user=user2).create_workspace(
            "test workspace2", save_now=True
        )
        folderb = api2.create(content_type_list.Folder.slug, workspace2, None, "folder b", "", True)

        api2.copy(item=text_file, new_parent=folderb, new_label="test_file_copy")

        transaction.commit()
        text_file_copy = api2.get_one_by_label_and_parent("test_file_copy", folderb)

        assert len(text_file.children.all()) == 2
        assert len(text_file_copy.children.all()) == 2
        assert text_file.children[0].raw_content == "just a comment"
        assert text_file_copy.children[0].raw_content == text_file.children[0].raw_content
        assert text_file_copy.children[0].id != text_file.children[0].id
        assert text_file_copy.children[0].created == text_file.children[0].created

        assert text_file.children[1].raw_content == "just another comment"
        assert text_file_copy.children[1].raw_content == text_file.children[1].raw_content
        assert text_file_copy.children[1].id != text_file.children[1].id
        assert text_file_copy.children[1].created == text_file.children[1].created
        # INFO - G.M - 2019-04-30 - check if both recursive
        # revision tree of content and copy are similar
        assert len(text_file_copy.get_tree_revisions()) == len(text_file.get_tree_revisions()) + 3
        for num, revision in enumerate(text_file_copy.get_tree_revisions()[:-3]):
            assert (
                text_file.get_tree_revisions()[num].revision_type
                == text_file_copy.get_tree_revisions()[num].revision_type
            )
        # INFO - G.M - 2019-04-30 - check if all supplementary revision are copy one.
        for revision in text_file_copy.get_tree_revisions()[-3:]:
            assert revision.revision_type == ActionDescription.COPY

    def test_unit_copy_file_different_label_different_parent__err__allowed_subcontent(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        foldera = api.create(content_type_list.Folder.slug, workspace, None, "folder a", "", True)
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=foldera,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")

        api.save(text_file, ActionDescription.CREATION)
        api2 = ContentApi(current_user=user2, session=session, config=app_config)
        workspace2 = workspace_api_factory.get(current_user=user2).create_workspace(
            "test workspace2", save_now=True
        )
        folderb = api2.create(
            content_type_list.Folder.slug, workspace2, None, "folder b", "", False
        )
        api2.set_allowed_content(folderb, [])
        api2.save(folderb)

        with pytest.raises(UnallowedSubContent):
            api2.copy(item=text_file, new_parent=folderb, new_label="test_file_copy")

    def test_unit_copy_file__same_label_different_parent_ok(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        foldera = api.create(content_type_list.Folder.slug, workspace, None, "folder a", "", True)
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=foldera,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")

        api.save(text_file, ActionDescription.CREATION)
        api2 = ContentApi(current_user=user2, session=session, config=app_config)
        workspace2 = workspace_api_factory.get(current_user=user2).create_workspace(
            "test workspace2", save_now=True
        )
        folderb = api2.create(content_type_list.Folder.slug, workspace2, None, "folder b", "", True)
        api2.copy(item=text_file, new_parent=folderb)

        transaction.commit()
        text_file_copy = api2.get_one_by_label_and_parent("test_file", folderb)

        assert text_file != text_file_copy
        assert text_file_copy.content_id != text_file.content_id
        assert text_file_copy.workspace_id == workspace2.workspace_id
        assert text_file_copy.depot_file.file.read() == text_file.depot_file.file.read()
        assert text_file_copy.depot_file.path != text_file.depot_file.path
        assert text_file_copy.label == text_file.label
        assert text_file_copy.type == text_file.type
        assert text_file_copy.parent.content_id == folderb.content_id
        assert text_file_copy.owner.user_id == user2.user_id
        assert text_file_copy.description == text_file.description
        assert text_file_copy.file_extension == text_file.file_extension
        assert text_file_copy.file_mimetype == text_file.file_mimetype
        assert text_file_copy.revision_type == ActionDescription.COPY
        assert len(text_file_copy.revisions) == len(text_file.revisions) + 1

    def test_unit_copy_file_different_label_same_parent_ok(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        foldera = api.create(content_type_list.Folder.slug, workspace, None, "folder a", "", True)
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=foldera,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")

        api.save(text_file, ActionDescription.CREATION)
        api2 = ContentApi(current_user=user2, session=session, config=app_config)

        api2.copy(item=text_file, new_label="test_file_copy")

        transaction.commit()
        text_file_copy = api2.get_one_by_label_and_parent("test_file_copy", foldera)

        assert text_file != text_file_copy
        assert text_file_copy.content_id != text_file.content_id
        assert text_file_copy.workspace_id == workspace.workspace_id
        assert text_file_copy.depot_file.file.read() == text_file.depot_file.file.read()
        assert text_file_copy.depot_file.path != text_file.depot_file.path
        assert text_file_copy.label == "test_file_copy"
        assert text_file_copy.type == text_file.type
        assert text_file_copy.parent.content_id == foldera.content_id
        assert text_file_copy.owner.user_id == user2.user_id
        assert text_file_copy.description == text_file.description
        assert text_file_copy.file_extension == text_file.file_extension
        assert text_file_copy.file_mimetype == text_file.file_mimetype
        assert text_file_copy.revision_type == ActionDescription.COPY
        assert len(text_file_copy.revisions) == len(text_file.revisions) + 1

    def test_unit_copy_file_different_label_same_parent__err__subcontent_not_allowed(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        """
        re
        :return:
        """
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        foldera = api.create(content_type_list.Folder.slug, workspace, None, "folder a", "", True)

        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=foldera,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")
        api.save(text_file, ActionDescription.CREATION)
        with new_revision(session, transaction.manager, foldera):
            api.set_allowed_content(foldera, [])
            api.save(foldera)
        api2 = ContentApi(current_user=user2, session=session, config=app_config)

        with pytest.raises(UnallowedSubContent):
            api2.copy(item=text_file, new_label="test_file_copy")

    def test_unit_copy_file_different_label_same_parent__err__label_already_used(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="user1@user", profile=profile, save_now=True)
        user2 = uapi.create_minimal_user(email="user2@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        role_api_factory.get().create_one(
            user2, workspace, UserRoleInWorkspace.WORKSPACE_MANAGER, with_notif=False
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        foldera = api.create(content_type_list.Folder.slug, workspace, None, "folder a", "", True)
        already_exist = api.create(
            content_type_list.Folder.slug, workspace, foldera, "already_exist", "", True
        )
        with session.no_autoflush:
            text_file = api.create(
                content_type_slug=content_type_list.File.slug,
                workspace=workspace,
                parent=foldera,
                label="test_file",
                do_save=False,
            )
            api.update_file_data(text_file, "test_file", "text/plain", b"test_content")

        api.save(text_file, ActionDescription.CREATION)
        api2 = ContentApi(current_user=user2, session=session, config=app_config)
        with pytest.raises(ContentFilenameAlreadyUsedInFolder):
            api2.copy(item=text_file, new_label="already_exist")

        transaction.commit()
        new_already_exist = api2.get_one_by_label_and_parent("already_exist", foldera)

        # file has no changed
        assert new_already_exist.content_id == already_exist.content_id

    def test_mark_read__workspace(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user_a = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        user_b = uapi.create_minimal_user(
            email="this.is@another.user", profile=profile, save_now=True
        )

        wapi = workspace_api_factory.get(current_user=user_a)
        workspace1 = wapi.create_workspace("test workspace n°1", save_now=True)
        workspace2 = wapi.create_workspace("test workspace n°2", save_now=True)

        role_api1 = role_api_factory.get(current_user=user_a)
        role_api1.create_one(user_b, workspace1, UserRoleInWorkspace.READER, False)

        role_api2 = role_api_factory.get(current_user=user_b)
        role_api2.create_one(user_b, workspace2, UserRoleInWorkspace.READER, False)

        cont_api_a = ContentApi(current_user=user_a, session=session, config=app_config)
        cont_api_b = ContentApi(current_user=user_b, session=session, config=app_config)

        # Creates page_1 & page_2 in workspace 1
        #     and page_3 & page_4 in workspace 2
        page_1 = cont_api_a.create(
            content_type_list.Page.slug, workspace1, None, "this is a page", do_save=True
        )
        page_2 = cont_api_a.create(
            content_type_list.Page.slug, workspace1, None, "this is page1", do_save=True
        )
        page_3 = cont_api_a.create(
            content_type_list.Thread.slug, workspace2, None, "this is page2", do_save=True
        )
        page_4 = cont_api_a.create(
            content_type_list.File.slug, workspace2, None, "this is page3", do_save=True
        )

        for rev in page_1.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_2.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b not in rev.read_by.keys(), True)

        # Set as read the workspace n°1
        cont_api_b.mark_read__workspace(workspace=workspace1)

        for rev in page_1.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_2.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b not in rev.read_by.keys(), True)

        # Set as read the workspace n°2
        cont_api_b.mark_read__workspace(workspace=workspace2)

        for rev in page_1.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_2.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b in rev.read_by.keys(), True)

    def test_mark_read(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user_a = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        user_b = uapi.create_minimal_user(
            email="this.is@another.user", profile=profile, save_now=True
        )

        wapi = workspace_api_factory.get(current_user=user_a)
        workspace = wapi.create_workspace("test workspace", save_now=True)

        role_api = role_api_factory.get(current_user=user_a)
        role_api.create_one(user_b, workspace, UserRoleInWorkspace.READER, False)
        cont_api_a = ContentApi(current_user=user_a, session=session, config=app_config)
        cont_api_b = ContentApi(current_user=user_b, session=session, config=app_config)

        page_1 = cont_api_a.create(
            content_type_list.Page.slug, workspace, None, "this is a page", do_save=True
        )

        for rev in page_1.revisions:
            eq_(user_b not in rev.read_by.keys(), True)

        cont_api_b.mark_read(page_1)

        for rev in page_1.revisions:
            eq_(user_b in rev.read_by.keys(), True)

    def test_mark_read__all(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user_a = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        user_b = uapi.create_minimal_user(
            email="this.is@another.user", profile=profile, save_now=True
        )

        wapi = workspace_api_factory.get(current_user=user_a)
        workspace = wapi.create_workspace("test workspace", save_now=True)

        role_api = role_api_factory.get(current_user=user_a)
        role_api.create_one(user_b, workspace, UserRoleInWorkspace.READER, False)
        cont_api_a = ContentApi(current_user=user_a, session=session, config=app_config)
        cont_api_b = ContentApi(current_user=user_b, session=session, config=app_config)

        page_2 = cont_api_a.create(
            content_type_list.Page.slug, workspace, None, "this is page1", do_save=True
        )
        page_3 = cont_api_a.create(
            content_type_list.Thread.slug, workspace, None, "this is page2", do_save=True
        )
        page_4 = cont_api_a.create(
            content_type_list.File.slug, workspace, None, "this is page3", do_save=True
        )

        for rev in page_2.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b not in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b not in rev.read_by.keys(), True)

        session.refresh(page_2)
        session.refresh(page_3)
        session.refresh(page_4)

        cont_api_b.mark_read__all()

        for rev in page_2.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_3.revisions:
            eq_(user_b in rev.read_by.keys(), True)
        for rev in page_4.revisions:
            eq_(user_b in rev.read_by.keys(), True)

    def test_unit__update__ok__nominal_case(
        self,
        user_api_factory,
        workspace_api_factory,
        role_api_factory,
        session,
        app_config,
        content_type_list,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)

        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)

        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=False, flush=True
        )

        # Test starts here

        api = ContentApi(current_user=user1, session=session, config=app_config)

        p = api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=True,
        )

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = workspace_api_factory.get(current_user=user1).get_one(wid)
        api = ContentApi(current_user=user1, session=session, config=app_config)

        content = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = uapi.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config)
        content2 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        with new_revision(session=session, tm=transaction.manager, content=content2):
            api2.update_content(content2, "this is an updated page", new_raw_content="new content")
        api2.save(content2)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = workspace_api_factory.get(current_user=user1).get_one(wid)
        api = ContentApi(current_user=user1, session=session, config=app_config)

        updated = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        assert u2id == updated.owner_id, "the owner id should be {} (found {})".format(
            u2id, updated.owner_id
        )
        assert "this is an updated page" == updated.label
        assert "new content" == updated.raw_content
        assert ActionDescription.EDITION == updated.revision_type

    def test_unit__update__err__status_closed(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)

        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)

        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=False, flush=True
        )

        # Test starts here

        api = ContentApi(current_user=user1, session=session, config=app_config)

        p = api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=False,
        )
        p.status = "closed-validated"
        api.save(p)
        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = workspace_api_factory.get(current_user=user1).get_one(wid)
        api = ContentApi(current_user=user1, session=session, config=app_config)

        content = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = uapi.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config)
        content2 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        content2_nb_rev = len(content2.revisions)
        with pytest.raises(ContentInNotEditableState):
            with new_revision(session=session, tm=transaction.manager, content=content2):
                api2.update_content(content2, "this is an updated page", "new content")
        content3 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        assert content3.label == "this_is_a_page"
        assert content2_nb_rev == len(content3.revisions)

    def test_unit__update__err__label_already_used(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)

        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)

        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=False, flush=True
        )

        # Test starts here

        api = ContentApi(current_user=user1, session=session, config=app_config)

        p = api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=True,
        )
        api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page2",
            do_save=True,
        )
        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = workspace_api_factory.get(current_user=user1).get_one(wid)
        api = ContentApi(current_user=user1, session=session, config=app_config)

        content = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = uapi.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config)
        content2 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        content2_nb_rev = len(content2.revisions)
        with pytest.raises(ContentFilenameAlreadyUsedInFolder):
            with new_revision(session=session, tm=transaction.manager, content=content2):
                api2.update_content(content2, "this_is_a_page2", "new content")
            api2.save(content2)
        content3 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        assert content3.label == "this_is_a_page"
        assert content2_nb_rev == len(content3.revisions)

    def test_unit__update__err__label_dont_change(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)

        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)

        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=False, flush=True
        )

        # Test starts here

        api = ContentApi(current_user=user1, session=session, config=app_config)

        p = api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=True,
        )
        api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page2",
            do_save=True,
        )
        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = workspace_api_factory.get(current_user=user1).get_one(wid)
        api = ContentApi(current_user=user1, session=session, config=app_config)

        content = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = uapi.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config)
        content2 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        content2_nb_rev = len(content2.revisions)
        with pytest.raises(SameValueError):
            with new_revision(session=session, tm=transaction.manager, content=content2):
                api2.update_content(content2, "this_is_a_page", "")
        api2.save(content2)
        content3 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        assert content3.label == "this_is_a_page"
        assert content2_nb_rev == len(content3.revisions)

    def test_update_file_data__ok_nominal(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)

        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=True, flush=True
        )

        # Test starts here
        api = ContentApi(current_user=user1, session=session, config=app_config)
        p = api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=True,
        )

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        api.save(p)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace_api2 = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api2.get_one(wid)
        api = ContentApi(current_user=user1, session=session, config=app_config)

        content = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = uapi.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config)
        content2 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        with new_revision(session=session, tm=transaction.manager, content=content2):
            api2.update_file_data(content2, "index.html", "text/html", b"<html>hello world</html>")
        api2.save(content2)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace = workspace_api_factory.get(current_user=user1).get_one(wid)

        updated = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(
            u2id,
            updated.owner_id,
            "the owner id should be {} (found {})".format(u2id, updated.owner_id),
        )
        eq_("index.html", updated.file_name)
        eq_("text/html", updated.file_mimetype)
        eq_(b"<html>hello world</html>", updated.depot_file.file.read())
        eq_(ActionDescription.REVISION, updated.revision_type)

    def test_update_file_data__err__content_status_closed(
        self,
        workspace_api_factory,
        role_api_factory,
        session,
        app_config,
        content_type_list,
        user_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)

        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=True, flush=True
        )

        # Test starts here
        api = ContentApi(current_user=user1, session=session, config=app_config)
        p = api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=False,
        )
        p.status = "closed-validated"
        api.save(p)

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        api.save(p)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace_api2 = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api2.get_one(wid)
        api = ContentApi(current_user=user1, session=session, config=app_config)

        content = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = uapi.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config)
        content2 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        content2_nb_rev = len(content2.revisions)
        with pytest.raises(ContentInNotEditableState):
            with new_revision(session=session, tm=transaction.manager, content=content2):
                api2.update_file_data(
                    content2, "index.html", "text/html", b"<html>hello world</html>"
                )
        content3 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        assert content3.label == "this_is_a_page"
        assert content2_nb_rev == len(content3.revisions)

    def test_update_file_data__err__content_archived(
        self,
        user_api_factory,
        workspace_api_factory,
        app_config,
        session,
        role_api_factory,
        content_type_list,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)

        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=True, flush=True
        )

        # Test starts here
        api = ContentApi(current_user=user1, session=session, config=app_config, show_archived=True)
        p = api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=False,
        )
        p.is_archived = True
        api.save(p)

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        api.save(p)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace_api2 = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api2.get_one(wid)
        api = ContentApi(current_user=user1, session=session, config=app_config, show_archived=True)

        content = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = uapi.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config, show_archived=True)
        content2 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        content2_nb_rev = len(content2.revisions)
        with pytest.raises(ContentInNotEditableState):
            with new_revision(session=session, tm=transaction.manager, content=content2):
                api2.update_file_data(
                    content2, "index.html", "text/html", b"<html>hello world</html>"
                )
        content3 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        assert content3.label == "this_is_a_page"
        assert content2_nb_rev == len(content3.revisions)

    def test_update_file_data__err__content_deleted(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)
        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=True, flush=True
        )

        # Test starts here
        api = ContentApi(current_user=user1, session=session, config=app_config, show_deleted=True)
        p = api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=False,
        )
        p.is_deleted = True
        api.save(p)

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        api.save(p)
        transaction.commit()

        # Refresh instances after commit
        user1 = uapi.get_one(u1id)
        workspace_api2 = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api2.get_one(wid)
        api = ContentApi(current_user=user1, session=session, config=app_config, show_deleted=True)

        content = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = uapi.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config, show_deleted=True)
        content2 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        content2_nb_rev = len(content2.revisions)
        with pytest.raises(ContentInNotEditableState):
            with new_revision(session=session, tm=transaction.manager, content=content2):
                api2.update_file_data(
                    content2, "index.html", "text/html", b"<html>hello world</html>"
                )
        content3 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        assert content3.label == "this_is_a_page"
        assert content2_nb_rev == len(content3.revisions)

    @pytest.mark.xfail(reason="Broken feature dues to pyramid behaviour")
    def test_update_no_change(
        self,
        user_api_factory,
        workspace_api_factory,
        role_api_factory,
        session,
        app_config,
        content_type_list,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)

        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=False, flush=True
        )
        api = ContentApi(current_user=user1, session=session, config=app_config)
        with session.no_autoflush:
            page = api.create(
                content_type_slug=content_type_list.Page.slug,
                workspace=workspace,
                label="same_content",
                do_save=False,
            )
            api.update_file_data(page, "index.html", "text/html", b"<html>Same Content Here</html>")
        api.save(page, ActionDescription.CREATION, do_notify=True)
        transaction.commit()

        api2 = ContentApi(current_user=user2, session=session, config=app_config)
        content2 = api2.get_one(page.content_id, content_type_list.Any_SLUG, workspace)
        content2_nb_rev = len(content2.revisions)
        with new_revision(session=session, tm=transaction.manager, content=content2):
            with pytest.raises(SameValueError):
                api2.update_file_data(
                    page, "index.html", "text/html", b"<html>Same Content Here</html>"
                )
        api2.save(content2)
        transaction.commit()
        content3 = api2.get_one(page.content_id, content_type_list.Any_SLUG, workspace)
        assert content3.label == "index"
        assert content2_nb_rev == len(content3.revisions)

    def test_archive_unarchive(
        self,
        user_api_factory,
        workspace_api_factory,
        session,
        app_config,
        content_type_list,
        role_api_factory,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        u1id = user1.user_id

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)

        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=True, flush=True
        )

        # show archived is used at the top end of the test
        api = ContentApi(current_user=user1, session=session, show_archived=True, config=app_config)
        p = api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=True,
        )

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        ####

        # refresh after commit
        user1 = uapi.get_one(u1id)
        workspace = workspace_api_factory.get(current_user=user1).get_one(wid)

        content = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2api = user_api_factory.get()
        u2 = u2api.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config, show_archived=True)
        content2 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        with new_revision(session=session, tm=transaction.manager, content=content2):
            api2.archive(content2)
        api2.save(content2)
        transaction.commit()

        # refresh after commit
        user1 = uapi.get_one(u1id)
        workspace = workspace_api_factory.get(current_user=user1).get_one(wid)
        u2 = uapi.get_one(u2id)
        api = ContentApi(current_user=user1, session=session, config=app_config, show_archived=True)
        api2 = ContentApi(current_user=u2, session=session, config=app_config, show_archived=True)

        updated = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(
            u2id,
            updated.owner_id,
            "the owner id should be {} (found {})".format(u2id, updated.owner_id),
        )
        eq_(True, updated.is_archived)
        eq_(ActionDescription.ARCHIVING, updated.revision_type)

        ####

        updated2 = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        with new_revision(session=session, tm=transaction.manager, content=updated):
            api.unarchive(updated)
        api.save(updated2)
        eq_(False, updated2.is_archived)
        eq_(ActionDescription.UNARCHIVING, updated2.revision_type)
        eq_(u1id, updated2.owner_id)

    def test_delete_undelete(
        self,
        user_api_factory,
        workspace_api_factory,
        role_api_factory,
        session,
        app_config,
        content_type_list,
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user1 = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        u1id = user1.user_id

        workspace_api = workspace_api_factory.get(current_user=user1)
        workspace = workspace_api.create_workspace("test workspace", save_now=True)
        wid = workspace.workspace_id

        user2 = uapi.create_minimal_user("this.is@another.user")
        uapi.save(user2)

        role_api_factory.get(current_user=user1).create_one(
            user2, workspace, UserRoleInWorkspace.CONTENT_MANAGER, with_notif=True, flush=True
        )

        # show archived is used at the top end of the test
        api = ContentApi(current_user=user1, session=session, config=app_config, show_deleted=True)
        p = api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=workspace,
            parent=None,
            label="this_is_a_page",
            do_save=True,
        )

        u1id = user1.user_id
        u2id = user2.user_id
        pcid = p.content_id
        poid = p.owner_id

        transaction.commit()

        ####
        user1 = uapi.get_one(u1id)
        workspace = workspace_api_factory.get(current_user=user1).get_one(wid)

        content = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(u1id, content.owner_id)
        eq_(poid, content.owner_id)

        u2 = uapi.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config, show_deleted=True)
        content2 = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        with new_revision(session=session, tm=transaction.manager, content=content2):
            api2.delete(content2)
        api2.save(content2)
        transaction.commit()

        ####

        user1 = uapi.get_one(u1id)
        workspace = workspace_api_factory.get(current_user=user1).get_one(wid)
        # show archived is used at the top end of the test
        api = ContentApi(current_user=user1, session=session, config=app_config, show_deleted=True)
        u2 = uapi.get_one(u2id)
        api2 = ContentApi(current_user=u2, session=session, config=app_config, show_deleted=True)

        updated = api2.get_one(pcid, content_type_list.Any_SLUG, workspace)
        eq_(
            u2id,
            updated.owner_id,
            "the owner id should be {} (found {})".format(u2id, updated.owner_id),
        )
        eq_(True, updated.is_deleted)
        eq_(ActionDescription.DELETION, updated.revision_type)

        ####

        updated2 = api.get_one(pcid, content_type_list.Any_SLUG, workspace)
        with new_revision(tm=transaction.manager, session=session, content=updated2):
            api.undelete(updated2)
        api.save(updated2)
        eq_(False, updated2.is_deleted)
        eq_(ActionDescription.UNDELETION, updated2.revision_type)
        eq_(u1id, updated2.owner_id)

    def test_unit__get_last_active__ok__nominal_case(
        self, user_api_factory, workspace_api_factory, session, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        workspace2 = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace2", save_now=True
        )

        api = ContentApi(current_user=user, session=session, config=app_config)
        main_folder_workspace2 = api.create(
            content_type_list.Folder.slug, workspace2, None, "Hepla", "", True
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        secondly_created = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        secondly_created_but_not_updated = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        secondly_created_but_not_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )

        content_workspace_2 = api.create(
            content_type_list.Page.slug,
            workspace2,
            main_folder_workspace2,
            "content_workspace_2",
            "",
            True,
        )
        last_actives = api.get_last_active()
        assert len(last_actives) == 9
        # workspace_2 content
        assert last_actives[0] == content_workspace_2
        # comment is newest than page2
        assert last_actives[1] == firstly_created_but_recently_commented
        assert last_actives[2] == secondly_created_but_not_commented
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert last_actives[3] == firstly_created_but_recently_updated
        assert last_actives[4] == secondly_created_but_not_updated
        # creation order is inverted here as last created is last active
        assert last_actives[5] == secondly_created
        assert last_actives[6] == firstly_created
        # folder subcontent modification does not change folder order
        assert last_actives[7] == main_folder
        # folder subcontent modification does not change folder order
        # (workspace2)
        assert last_actives[8] == main_folder_workspace2

    def test_unit__get_last_active__ok__do_no_show_deleted_archived(
        self, session, workspace_api_factory, app_config, user_api_factory, content_type_list
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace2", save_now=True
        )

        api = ContentApi(
            current_user=user,
            session=session,
            config=app_config,
            show_deleted=False,
            show_archived=False,
        )
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        archived = api.create(
            content_type_list.Page.slug, workspace, main_folder, "archived", "", True
        )
        deleted = api.create(
            content_type_list.Page.slug, workspace, main_folder, "deleted", "", True
        )
        api.create_comment(workspace, parent=archived, content="just a comment", do_save=True)
        api.create_comment(workspace, parent=deleted, content="just a comment", do_save=True)
        with new_revision(session=session, tm=transaction.manager, content=archived):
            api.archive(archived)
            api.save(archived)

        with new_revision(session=session, tm=transaction.manager, content=deleted):
            api.delete(deleted)
            api.save(deleted)
        normal = api.create(content_type_list.Page.slug, workspace, main_folder, "normal", "", True)
        api.create_comment(workspace, parent=normal, content="just a comment", do_save=True)

        last_actives = api.get_last_active()
        assert len(last_actives) == 2
        assert last_actives[0].content_id == normal.content_id
        assert last_actives[1].content_id == main_folder.content_id

        api._show_deleted = True
        api._show_archived = False
        last_actives = api.get_last_active()
        assert len(last_actives) == 3
        assert last_actives[0] == normal
        assert last_actives[1] == deleted
        assert last_actives[2] == main_folder

        api._show_deleted = False
        api._show_archived = True
        last_actives = api.get_last_active()
        assert len(last_actives) == 3
        assert last_actives[0] == normal
        assert last_actives[1] == archived
        assert last_actives[2] == main_folder

        api._show_deleted = True
        api._show_archived = True
        last_actives = api.get_last_active()
        assert len(last_actives) == 4
        assert last_actives[0] == normal
        assert last_actives[1] == deleted
        assert last_actives[2] == archived
        assert last_actives[3] == main_folder

    def test_unit__get_last_active__ok__workspace_filter_workspace_full(
        self, user_api_factory, session, app_config, workspace_api_factory, content_type_list
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )

        api = ContentApi(current_user=user, session=session, config=app_config)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        secondly_created = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        secondly_created_but_not_updated = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        secondly_created_but_not_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )

        last_actives = api.get_last_active(workspace=workspace)
        assert len(last_actives) == 7
        # comment is newest than page2
        assert last_actives[0] == firstly_created_but_recently_commented
        assert last_actives[1] == secondly_created_but_not_commented
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert last_actives[2] == firstly_created_but_recently_updated
        assert last_actives[3] == secondly_created_but_not_updated
        # creation order is inverted here as last created is last active
        assert last_actives[4] == secondly_created
        assert last_actives[5] == firstly_created
        # folder subcontent modification does not change folder order
        assert last_actives[6] == main_folder

    def test_unit__get_last_active__ok__workspace_filter_workspace_content_ids(
        self, session, user_api_factory, workspace_api_factory, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )

        api = ContentApi(current_user=user, session=session, config=app_config)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        secondly_created = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        secondly_created_but_not_updated = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        secondly_created_but_not_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )

        selected_contents = [
            firstly_created_but_recently_commented,
            firstly_created_but_recently_updated,
            firstly_created,
            main_folder,
        ]
        content_ids = [content.content_id for content in selected_contents]
        last_actives = api.get_last_active(workspace=workspace, content_ids=content_ids)
        assert len(last_actives) == 4
        # comment is newest than page2
        assert last_actives[0] == firstly_created_but_recently_commented
        assert secondly_created_but_not_commented not in last_actives
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert last_actives[1] == firstly_created_but_recently_updated
        assert secondly_created_but_not_updated not in last_actives
        # creation order is inverted here as last created is last active
        assert secondly_created not in last_actives
        assert last_actives[2] == firstly_created
        # folder subcontent modification does not change folder order
        assert last_actives[3] == main_folder

    def test_unit__get_last_active__ok__workspace_filter_workspace_limit_2_multiples_times(
        self, session, user_api_factory, workspace_api_factory, app_config, content_type_list
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )

        api = ContentApi(current_user=user, session=session, config=app_config)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        firstly_created = api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        secondly_created = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        secondly_created_but_not_updated = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        secondly_created_but_not_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )

        last_actives = api.get_last_active(workspace=workspace, limit=2)
        assert len(last_actives) == 2
        # comment is newest than page2
        assert last_actives[0] == firstly_created_but_recently_commented
        assert last_actives[1] == secondly_created_but_not_commented

        last_actives = api.get_last_active(
            workspace=workspace, limit=2, before_content=last_actives[1]
        )
        assert len(last_actives) == 2
        # last updated content is newer than other one despite creation
        # of the other is more recent
        assert last_actives[0] == firstly_created_but_recently_updated
        assert last_actives[1] == secondly_created_but_not_updated

        last_actives = api.get_last_active(
            workspace=workspace, limit=2, before_content=last_actives[1]
        )
        assert len(last_actives) == 2
        # creation order is inverted here as last created is last active
        assert last_actives[0] == secondly_created
        assert last_actives[1] == firstly_created

        last_actives = api.get_last_active(
            workspace=workspace, limit=2, before_content=last_actives[1]
        )
        assert len(last_actives) == 1
        # folder subcontent modification does not change folder order
        assert last_actives[0] == main_folder

    def test_unit__get_last_active__ok__workspace_filter_workspace_empty(
        self, session, workspace_api_factory, app_config, user_api_factory, content_type_list
    ):
        uapi = user_api_factory.get()

        profile = Profile.ADMIN

        user = uapi.create_minimal_user(email="this.is@user", profile=profile, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        workspace2 = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace2", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        main_folder = api.create(
            content_type_list.Folder.slug, workspace, None, "this is randomized folder", "", True
        )
        # creation order test
        api.create(
            content_type_list.Page.slug, workspace, main_folder, "creation_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another creation_order_test",
            "",
            True,
        )
        # update order test
        firstly_created_but_recently_updated = api.create(
            content_type_list.Page.slug, workspace, main_folder, "update_order_test", "", True
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "another update_order_test",
            "",
            True,
        )
        with new_revision(
            session=session, tm=transaction.manager, content=firstly_created_but_recently_updated
        ):
            firstly_created_but_recently_updated.description = "Just an update"
        api.save(firstly_created_but_recently_updated)
        # comment change order
        firstly_created_but_recently_commented = api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is randomized label content",
            "",
            True,
        )
        api.create(
            content_type_list.Page.slug,
            workspace,
            main_folder,
            "this is another randomized label content",
            "",
            True,
        )
        api.create_comment(
            workspace, firstly_created_but_recently_commented, "juste a super comment", True
        )

        last_actives = api.get_last_active(workspace=workspace2)
        assert len(last_actives) == 0

    def test_unit__get_all_query__with_user(
        self,
        session,
        workspace_api_factory,
        app_config,
        user_api_factory,
        content_type_list,
        admin_user,
    ) -> None:
        uapi = user_api_factory.get()
        user = uapi.create_minimal_user(email="this.is@user", profile=Profile.USER, save_now=True)
        workspace = workspace_api_factory.get(current_user=user).create_workspace(
            "test workspace", save_now=True
        )
        api = ContentApi(current_user=user, session=session, config=app_config)
        api.create(
            content_type_slug=content_type_list.Page.slug,
            workspace=workspace,
            label="foo",
            do_save=True,
        )
        assert len(list(api.get_all_query(user=user))) == 1
        assert len(list(api.get_all_query(user=admin_user))) == 0


@pytest.mark.usefixtures("test_fixture")
class TestContentApiSecurity(object):
    def test_unit__cant_get_non_access_content__ok__nominal_case(
        self, session, workspace_api_factory, admin_user, app_config, content_type_list
    ):
        bob = session.query(User).filter(User.email == "bob@fsf.local").one()

        bob_workspace = workspace_api_factory.get(current_user=bob).create_workspace(
            "bob_workspace", save_now=True
        )
        admin_workspace = workspace_api_factory.get(current_user=admin_user).create_workspace(
            "admin_workspace", save_now=True
        )

        ContentApi(current_user=bob, session=session, config=app_config).create(
            content_type_slug=content_type_list.Page.slug,
            workspace=bob_workspace,
            label="bob_page",
            do_save=True,
        )

        ContentApi(current_user=admin_user, session=session, config=app_config).create(
            content_type_slug=content_type_list.Page.slug,
            workspace=admin_workspace,
            label="admin_page",
            do_save=True,
        )

        bob_viewable = ContentApi(current_user=bob, session=session, config=app_config).get_all()
        eq_(1, len(bob_viewable), "Bob should view only one content")
        eq_(
            "bob_page",
            bob_viewable[0].label,
            'Bob should not view "{0}" content'.format(bob_viewable[0].label),
        )
