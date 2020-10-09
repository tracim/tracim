# -*- coding: utf-8 -*-
from unittest.mock import MagicMock

import pytest

from tracim_backend import WebdavAppFactory
from tracim_backend.lib.core.notifications import DummyNotifier
from tracim_backend.lib.webdav import TracimDavProvider
from tracim_backend.lib.webdav import TracimDomainController
from tracim_backend.lib.webdav.resources import FolderResource
from tracim_backend.lib.webdav.resources import RootResource
from tracim_backend.lib.webdav.resources import WorkspaceResource
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.tests.fixtures import *  # noqa: F403,F40
from tracim_backend.tests.utils import eq_
from tracim_backend.tests.utils import webdav_put_new_test_file_helper


@pytest.mark.parametrize("config_section", [{"name": "webdav_test"}], indirect=True)
class TestWebdavFactory(object):
    def test_unit__initConfig__ok__nominal_case(self, settings):
        """
        Check if config is correctly modify for wsgidav using mocked
        wsgidav and tracim conf (as dict)
        :return:
        """
        mock = MagicMock()
        mock2 = MagicMock()
        mock._initConfig = WebdavAppFactory._initConfig
        config = mock._initConfig(mock2, **settings)
        assert config
        assert config["acceptbasic"] is True
        assert config["acceptdigest"] is False
        assert config["defaultdigest"] is False
        # TODO - G.M - 25-05-2018 - Better check for middleware stack config
        assert "middleware_stack" in config
        assert len(config["middleware_stack"]) == 6
        assert "provider_mapping" in config
        assert "/" in config["provider_mapping"]
        assert isinstance(config["provider_mapping"]["/"], TracimDavProvider)
        assert "domaincontroller" in config
        assert isinstance(config["domaincontroller"], TracimDomainController)


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
class TestWebDav(object):
    def test_unit__get_root__ok(
        self, app_config, webdav_provider, user_api_factory, webdav_environ_factory
    ):
        root = webdav_provider.getResourceInst(
            "/",
            webdav_environ_factory.get(user_api_factory.get().get_one_by_email("bob@fsf.local")),
        )
        assert root, "Path / should return a RootResource instance"
        assert isinstance(root, RootResource)

    def test_unit__list_workspaces_with_user__ok(
        self, app_config, webdav_provider, user_api_factory, webdav_environ_factory
    ):

        root = webdav_provider.getResourceInst(
            "/",
            webdav_environ_factory.get(user_api_factory.get().get_one_by_email("bob@fsf.local")),
        )
        assert root, "Path / should return a RootResource instance"
        assert isinstance(root, RootResource), "Path / should return a RootResource instance"

        children = root.getMemberList()
        eq_(
            2,
            len(children),
            msg="RootResource should return 2 workspaces instead {0}".format(len(children)),
        )

        workspaces_names = [w.name for w in children]
        assert "Recipes.space" in workspaces_names, "Recipes should be in names ({0})".format(
            workspaces_names
        )
        assert "Others.space" in workspaces_names, "Others should be in names ({0})".format(
            workspaces_names
        )

    def test_unit__list_workspaces_with_admin__ok(
        self, app_config, webdav_provider, user_api_factory, webdav_environ_factory
    ):

        root = webdav_provider.getResourceInst(
            "/",
            webdav_environ_factory.get(
                user_api_factory.get().get_one_by_email("admin@admin.admin")
            ),
        )
        assert root, "Path / a RootResource should return instance"
        assert isinstance(root, RootResource), "Path / should return a RootResource instance"

        children = root.getMemberList()
        eq_(
            2,
            len(children),
            msg="RootResource should return 3 workspaces instead {0}".format(len(children)),
        )

        workspaces_names = [w.name for w in children]
        assert "Recipes.space" in workspaces_names, "Recipes should be in names ({0})".format(
            workspaces_names
        )
        assert "Business.space" in workspaces_names, "Business should be in names ({0})".format(
            workspaces_names
        )

    def test_unit__list_workspace_folders__ok(
        self, app_config, webdav_provider, user_api_factory, webdav_environ_factory
    ):

        Recipes = webdav_provider.getResourceInst(
            "/Recipes.space/",
            webdav_environ_factory.get(user_api_factory.get().get_one_by_email("bob@fsf.local")),
        )
        assert isinstance(
            Recipes, WorkspaceResource
        ), "Path /Recipes should return a Wrkspace instance"

        children = Recipes.getMemberList()
        eq_(2, len(children), msg="Recipes should list 2 folders instead {0}".format(len(children)))

        folders_names = [f.name for f in children]
        assert "Salads" in folders_names, "Salads should be in names ({0})".format(folders_names)
        assert "Desserts" in folders_names, "Desserts should be in names ({0})".format(
            folders_names
        )

    def test_unit__list_content__ok(
        self, app_config, webdav_provider, user_api_factory, webdav_environ_factory
    ):
        Desserts_dir = webdav_provider.getResourceInst(
            "/Recipes.space/Desserts",
            webdav_environ_factory.get(user_api_factory.get().get_one_by_email("bob@fsf.local")),
        )
        assert isinstance(
            Desserts_dir, FolderResource
        ), "Path /Desserts should return a Folder instance"
        children = Desserts_dir.getMemberList()
        eq_(5, len(children), msg="Dessert should list 5 Files instead {0}".format(len(children)))

        content_names = [c.name for c in children]
        assert (
            "Brownie Recipe.html" in content_names
        ), "Brownie Recipe.html should be in names ({0})".format(content_names)

        assert (
            "Best Cakesʔ.thread.html" in content_names
        ), "Best Cakesʔ.thread.html should be in names ({0})".format(content_names)
        assert "Apple_Pie.txt" in content_names, "Apple_Pie.txt should be in names ({0})".format(
            content_names
        )

        assert (
            "Fruits Desserts" in content_names
        ), "Fruits Desserts should be in names ({0})".format(content_names)

        assert (
            "Tiramisu Recipe.document.html" in content_names
        ), "Tiramisu Recipe.document.html should be in names ({0})".format(content_names)

    def test_unit__get_content__ok(
        self, app_config, user_api_factory, webdav_provider, webdav_environ_factory, session
    ):
        pie = webdav_provider.getResourceInst(
            "/Recipes.space/Desserts/Apple_Pie.txt",
            webdav_environ_factory.get(user_api_factory.get().get_one_by_email("bob@fsf.local")),
        )

        assert pie, "Apple_Pie should be found"
        eq_("Apple_Pie.txt", pie.name)

    def test_unit__delete_content__ok(
        self, app_config, user_api_factory, webdav_provider, webdav_environ_factory, session
    ):
        pie = webdav_provider.getResourceInst(
            "/Recipes.space/Desserts/Apple_Pie.txt",
            webdav_environ_factory.get(user_api_factory.get().get_one_by_email("bob@fsf.local")),
        )

        content_pie = (
            session.query(ContentRevisionRO).filter(Content.label == "Apple_Pie").one()
        )  # It must exist only one revision, cf fixtures
        eq_(False, content_pie.is_deleted, msg="Content should not be deleted !")
        content_pie_id = content_pie.content_id

        pie.delete()

        session.flush()
        content_pie = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_pie_id)
            .order_by(ContentRevisionRO.revision_id.desc())
            .first()
        )
        eq_(True, content_pie.is_deleted, msg="Content should be deleted!")

        result = webdav_provider.getResourceInst(
            "/Recipes.space/Desserts/Apple_Pie.txt",
            webdav_environ_factory.get(user_api_factory.get().get_one_by_email("bob@fsf.local")),
        )
        eq_(None, result, msg="Result should be None instead {0}".format(result))

    def test_unit__create_content__ok(
        self, app_config, webdav_provider, webdav_environ_factory, user_api_factory
    ):

        environ = webdav_environ_factory.get(
            user_api_factory.get().get_one_by_email("bob@fsf.local")
        )
        result = webdav_provider.getResourceInst("/Recipes.space/Salads/greek_salad.txt", environ)

        eq_(None, result, msg="Result should be None instead {0}".format(result))

        result = webdav_put_new_test_file_helper(
            webdav_provider, environ, "/Recipes.space/Salads/greek_salad.txt", b"Greek Salad\n"
        )

        assert result, "Result should not be None instead {0}".format(result)
        eq_(
            b"Greek Salad\n",
            result.content.depot_file.file.read(),
            msg='fiel content should be "Greek Salad\n" but it is {0}'.format(
                result.content.depot_file.file.read()
            ),
        )

    def test_unit__create_delete_and_create_file__ok(
        self, app_config, webdav_provider, webdav_environ_factory, user_api_factory, session
    ):

        environ = webdav_environ_factory.get(
            user_api_factory.get().get_one_by_email("bob@fsf.local")
        )
        new_file = webdav_provider.getResourceInst("/Recipes.space/Salads/greek_salad.txt", environ)

        eq_(None, new_file, msg="Result should be None instead {0}".format(new_file))

        # create it
        new_file = webdav_put_new_test_file_helper(
            webdav_provider, environ, "/Recipes.space/Salads/greek_salad.txt", b"Greek Salad\n"
        )
        assert new_file, "Result should not be None instead {0}".format(new_file)

        content_new_file = (
            session.query(ContentRevisionRO).filter(Content.label == "greek_salad").one()
        )  # It must exist only one revision
        eq_(False, content_new_file.is_deleted, msg="Content should not be deleted!")
        content_new_file_id = content_new_file.content_id

        # Delete if
        new_file.delete()

        session.flush()
        content_pie = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_new_file_id)
            .order_by(ContentRevisionRO.revision_id.desc())
            .first()
        )
        eq_(True, content_pie.is_deleted, msg="Content should be deleted!")

        result = webdav_provider.getResourceInst(
            "/Recipes.space/Salads/greek_salad.txt",
            webdav_environ_factory.get(user_api_factory.get().get_one_by_email("bob@fsf.local")),
        )
        eq_(None, result, msg="Result should be None instead {0}".format(result))

        # Then create it again
        new_file = webdav_put_new_test_file_helper(
            webdav_provider, environ, "/Recipes.space/Salads/greek_salad.txt", b"greek_salad\n"
        )
        assert new_file, "Result should not be None instead {0}".format(new_file)

        # Previous file is still dleeted
        session.flush()
        content_pie = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_new_file_id)
            .order_by(ContentRevisionRO.revision_id.desc())
            .first()
        )
        eq_(True, content_pie.is_deleted, msg="Content should be deleted!")

        # And an other file exist for this name
        content_new_new_file = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.label == "greek_salad")
            .order_by(ContentRevisionRO.revision_id.desc())
            .first()
        )
        assert (
            content_new_new_file.content_id != content_new_file_id
        ), "Contents ids should not be same!"

        eq_(False, content_new_new_file.is_deleted, msg="Content should not be deleted!")

    def test_unit__rename_content__ok(
        self, webdav_provider, webdav_environ_factory, app_config, session, user_api_factory
    ):

        environ = webdav_environ_factory.get(
            user_api_factory.get().get_one_by_email("admin@admin.admin")
        )
        pie = webdav_provider.getResourceInst("/Recipes.space/Desserts/Apple_Pie.txt", environ)

        content_pie = (
            session.query(ContentRevisionRO).filter(Content.label == "Apple_Pie").one()
        )  # It must exist only one revision, cf fixtures
        assert content_pie, "Apple_Pie should be exist"
        content_pie_id = content_pie.content_id

        pie.moveRecursive("/Recipes.space/Desserts/Apple_Pie_RENAMED.txt")

        # Database content is renamed
        content_pie = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_pie_id)
            .order_by(ContentRevisionRO.revision_id.desc())
            .first()
        )
        eq_(
            "Apple_Pie_RENAMED",
            content_pie.label,
            msg="File should be labeled Apple_Pie_RENAMED, not {0}".format(content_pie.label),
        )

    def test_unit__move_content__ok(
        self, webdav_provider, webdav_environ_factory, app_config, session, user_api_factory
    ):

        environ = webdav_environ_factory.get(
            user_api_factory.get().get_one_by_email("admin@admin.admin")
        )
        pie = webdav_provider.getResourceInst("/Recipes.space/Desserts/Apple_Pie.txt", environ)

        content_pie = (
            session.query(ContentRevisionRO).filter(Content.label == "Apple_Pie").one()
        )  # It must exist only one revision, cf fixtures
        assert content_pie, "Apple_Pie should be exist"
        content_pie_id = content_pie.content_id
        content_pie_parent = content_pie.parent
        eq_(content_pie_parent.label, "Desserts", msg="field parent should be Desserts")

        pie.moveRecursive("/Recipes.space/Salads/Apple_Pie.txt")  # move in f2

        # Database content is moved
        content_pie = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_pie_id)
            .order_by(ContentRevisionRO.revision_id.desc())
            .first()
        )

        assert (
            content_pie.parent.label != content_pie_parent.label
        ), "file should be moved in Salads but is in {0}".format(content_pie.parent.label)

    def test_unit__move_and_rename_content__ok(
        self, webdav_provider, webdav_environ_factory, app_config, session, user_api_factory
    ):

        environ = webdav_environ_factory.get(
            user_api_factory.get().get_one_by_email("admin@admin.admin")
        )
        pie = webdav_provider.getResourceInst("/Recipes.space/Desserts/Apple_Pie.txt", environ)

        content_pie = (
            session.query(ContentRevisionRO).filter(Content.label == "Apple_Pie").one()
        )  # It must exist only one revision, cf fixtures
        assert content_pie, "Apple_Pie should be exist"
        content_pie_id = content_pie.content_id
        content_pie_parent = content_pie.parent
        eq_(content_pie_parent.label, "Desserts", msg="field parent should be Desserts")

        pie.moveRecursive("/Business.space/Menus/Apple_Pie_RENAMED.txt")
        content_pie = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_pie_id)
            .order_by(ContentRevisionRO.revision_id.desc())
            .first()
        )
        assert (
            content_pie.parent.label != content_pie_parent.label
        ), "file should be moved in Recipesf2 but is in {0}".format(content_pie.parent.label)
        eq_(
            "Apple_Pie_RENAMED",
            content_pie.label,
            msg="File should be labeled Apple_Pie_RENAMED, not {0}".format(content_pie.label),
        )

    def test_unit__move_content__ok__another_workspace(
        self, webdav_provider, webdav_environ_factory, app_config, session, user_api_factory
    ):

        environ = webdav_environ_factory.get(
            user_api_factory.get().get_one_by_email("admin@admin.admin")
        )
        content_to_move_res = webdav_provider.getResourceInst(
            "/Recipes.space/Desserts/Apple_Pie.txt", environ
        )

        content_to_move = (
            session.query(ContentRevisionRO).filter(Content.label == "Apple_Pie").one()
        )  # It must exist only one revision, cf fixtures
        assert content_to_move, "Apple_Pie should be exist"
        content_to_move_id = content_to_move.content_id
        content_to_move_parent = content_to_move.parent
        eq_(content_to_move_parent.label, "Desserts", msg="field parent should be Desserts")

        content_to_move_res.moveRecursive(
            "/Business.space/Menus/Apple_Pie.txt"
        )  # move in Business, f1

        # Database content is moved
        content_to_move = (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content_to_move_id)
            .order_by(ContentRevisionRO.revision_id.desc())
            .first()
        )

        assert content_to_move.parent, "Content should have a parent"

        assert (
            content_to_move.parent.label == "Menus"
        ), "file should be moved in Infos but is in {0}".format(content_to_move.parent.label)

    def test_unit__update_content__ok(
        self, webdav_provider, webdav_environ_factory, app_config, session, user_api_factory
    ):

        environ = webdav_environ_factory.get(
            user_api_factory.get().get_one_by_email("admin@admin.admin")
        )
        result = webdav_provider.getResourceInst("/Recipes.space/Salads/greek_salad.txt", environ)

        eq_(None, result, msg="Result should be None instead {0}".format(result))

        result = webdav_put_new_test_file_helper(
            webdav_provider, environ, "/Recipes.space/Salads/greek_salad.txt", b"hello\n"
        )

        assert result, "Result should not be None instead {0}".format(result)
        eq_(
            b"hello\n",
            result.content.depot_file.file.read(),
            msg='fiel content should be "hello\n" but it is {0}'.format(
                result.content.depot_file.file.read()
            ),
        )

        # ReInit DummyNotifier counter
        DummyNotifier.send_count = 0

        # Update file content
        write_object = result.beginWrite(contentType="application/octet-stream")
        write_object.write(b"An other line")
        write_object.close()
        result.endWrite(withErrors=False)

        eq_(
            1,
            DummyNotifier.send_count,
            msg="DummyNotifier should send 1 mail, not {}".format(DummyNotifier.send_count),
        )
