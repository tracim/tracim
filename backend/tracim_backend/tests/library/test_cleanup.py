from pathlib import Path
import tempfile

import pytest
from sqlalchemy.orm.exc import NoResultFound
import transaction

from tracim_backend import ContentNotFound
from tracim_backend.applications.share.models import ContentShare
from tracim_backend.applications.upload_permissions.models import UploadPermission
from tracim_backend.lib.cleanup.cleanup import CleanupLib
from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import RevisionReadStatus
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.favorites import FavoriteContent
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.tracim_session import unprotected_content_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
class TestCleanupLib(object):
    def test_unit__anonymize_user__ok__nominal_case(self, session, app_config) -> None:
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user(email="bob@bob", username="bob")
        assert u.display_name == "bob"
        assert u.username == "bob"
        assert u.email == "bob@bob"
        cleanup_lib = CleanupLib(app_config=app_config, session=session)
        cleanup_lib.anonymize_user(u)
        assert u.display_name == "Deleted user"
        assert u.email.endswith("@anonymous.local")
        assert u.username is None

    def test_unit__anonymize_user__ok__explicit_name(self, session, app_config) -> None:
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user(email="bob@bob", username="bob")
        assert u.display_name == "bob"
        assert u.email == "bob@bob"
        cleanup_lib = CleanupLib(app_config=app_config, session=session)
        cleanup_lib.anonymize_user(u, anonymized_user_display_name="anonymous")
        assert u.display_name == "anonymous"
        assert u.email.endswith("@anonymous.local")
        assert u.username is None

    @pytest.mark.parametrize(
        "config_section", [{"name": "base_test_optional_email"}], indirect=True
    )
    def test_unit__anonymize_user__ok__with_only_username(self, session, app_config) -> None:
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user(username="bob")
        assert u.display_name == "bob"
        assert u.username == "bob"
        assert u.email is None
        cleanup_lib = CleanupLib(app_config=app_config, session=session)
        cleanup_lib.anonymize_user(u, anonymized_user_display_name="anonymous")
        assert u.display_name == "anonymous"
        assert u.email.endswith("@anonymous.local")
        assert u.username is None

    def test_unit__anonymize_user__ok__with_only_email(self, session, app_config) -> None:
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user(email="bob@bob")
        assert u.display_name == "bob"
        assert u.email == "bob@bob"
        assert u.username is None
        cleanup_lib = CleanupLib(app_config=app_config, session=session)
        cleanup_lib.anonymize_user(u, anonymized_user_display_name="anonymous")
        assert u.display_name == "anonymous"
        assert u.email.endswith("@anonymous.local")
        assert u.username is None

    def test_unit__delete_content__ok__nominal_case(
        self,
        session,
        app_config,
        content_type_list,
        content_api_factory,
        workspace_api_factory,
        share_lib_factory,
    ) -> None:

        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True
        )
        workspace_api = workspace_api_factory.get()
        test_workspace = workspace_api.create_workspace("test_workspace")
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder_id = folder.content_id
        file_ = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            parent=folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        file_id = file_.content_id
        comment = content_api.create_comment(
            workspace=test_workspace, parent=file_, content="Toto", do_save=True, do_notify=False
        )
        comment_id = comment.content_id
        share_api = share_lib_factory.get()
        shares = share_api.share_content(file_, emails=["test@test.test"])
        share_id = shares[0].share_id
        session.flush()
        transaction.commit()
        assert content_api.get_one(folder_id, content_type=content_type_list.Any_SLUG)
        assert content_api.get_one(file_id, content_type=content_type_list.Any_SLUG)
        assert content_api.get_one(comment_id, content_type=content_type_list.Any_SLUG)
        assert session.query(ContentShare).filter(ContentShare.share_id == share_id).one()

        with unprotected_content_revision(session) as unprotected_session:
            cleanup_lib = CleanupLib(app_config=app_config, session=unprotected_session)
            cleanup_lib.delete_content(folder)
            session.flush()
        transaction.commit()
        with pytest.raises(ContentNotFound):
            content_api.get_one(folder_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(ContentNotFound):
            content_api.get_one(file_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(ContentNotFound):
            content_api.get_one(comment_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(NoResultFound):
            session.query(ContentShare).filter(ContentShare.share_id == share_id).one()

    def test_unit__delete_workspace__ok__nominal_case(
        self,
        session,
        app_config,
        content_type_list,
        content_api_factory,
        workspace_api_factory,
        share_lib_factory,
        upload_permission_lib_factory,
    ) -> None:

        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True
        )
        workspace_api = workspace_api_factory.get()
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        workspace_id = test_workspace.workspace_id
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder_id = folder.content_id
        folder2 = content_api.create(
            label="test-folder2",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder2_id = folder2.content_id
        file_ = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            parent=folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        file_id = file_.content_id
        comment = content_api.create_comment(
            workspace=test_workspace, parent=file_, content="Toto", do_save=True, do_notify=False
        )
        comment_id = comment.content_id
        share_api = share_lib_factory.get()
        shares = share_api.share_content(file_, emails=["test@test.test"])
        share_id = shares[0].share_id
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permissions = upload_permission_lib.add_permission_to_workspace(
            workspace=test_workspace, emails=["toto@toto.toto"]
        )
        upload_permission_id = upload_permissions[0].upload_permission_id
        session.flush()
        transaction.commit()
        assert content_api.get_one(folder_id, content_type=content_type_list.Any_SLUG)
        assert content_api.get_one(file_id, content_type=content_type_list.Any_SLUG)
        assert content_api.get_one(comment_id, content_type=content_type_list.Any_SLUG)
        assert session.query(ContentShare).filter(ContentShare.share_id == share_id).one()
        assert (
            session.query(UploadPermission)
            .filter(UploadPermission.upload_permission_id == upload_permission_id)
            .one()
        )
        with unprotected_content_revision(session) as unprotected_session:
            cleanup_lib = CleanupLib(app_config=app_config, session=unprotected_session)
            cleanup_lib.delete_workspace(test_workspace)
            session.flush()
        transaction.commit()
        with pytest.raises(NoResultFound):
            session.query(Workspace).filter(Workspace.workspace_id == workspace_id).one()
        with pytest.raises(NoResultFound):
            session.query(UserRoleInWorkspace).filter(
                UserRoleInWorkspace.workspace_id == workspace_id
            ).one()
        with pytest.raises(NoResultFound):
            session.query(UploadPermission).filter(
                UploadPermission.workspace_id == workspace_id
            ).one()
        with pytest.raises(ContentNotFound):
            content_api.get_one(folder2_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(ContentNotFound):
            content_api.get_one(folder_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(ContentNotFound):
            content_api.get_one(file_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(ContentNotFound):
            content_api.get_one(comment_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(NoResultFound):
            session.query(ContentShare).filter(ContentShare.share_id == share_id).one()
        with pytest.raises(NoResultFound):
            session.query(UploadPermission).filter(
                UploadPermission.upload_permission_id == upload_permission_id
            ).one()

    def test_unit__delete_user_associated_data__ok__nominal_case(
        self,
        admin_user,
        session,
        app_config,
        content_type_list,
        content_api_factory,
        workspace_api_factory,
        share_lib_factory,
        upload_permission_lib_factory,
    ) -> None:

        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True
        )
        workspace_api = workspace_api_factory.get()
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        session.flush()
        workspace_id = test_workspace.workspace_id
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder_id = folder.content_id
        folder2 = content_api.create(
            label="test-folder2",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        folder2_id = folder2.content_id
        file_ = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            parent=folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        content_api.set_favorite(folder, do_save=True)
        file_id = file_.content_id
        comment = content_api.create_comment(
            workspace=test_workspace, parent=file_, content="Toto", do_save=True, do_notify=False
        )
        comment_id = comment.content_id
        share_api = share_lib_factory.get()
        shares = share_api.share_content(file_, emails=["test@test.test"])
        share_id = shares[0].share_id
        upload_permission_lib = upload_permission_lib_factory.get()
        upload_permissions = upload_permission_lib.add_permission_to_workspace(
            workspace=test_workspace, emails=["toto@toto.toto"]
        )
        upload_permission_id = upload_permissions[0].upload_permission_id
        session.flush()
        transaction.commit()
        assert content_api.get_one(folder_id, content_type=content_type_list.Any_SLUG)
        assert content_api.get_one(file_id, content_type=content_type_list.Any_SLUG)
        assert content_api.get_one(comment_id, content_type=content_type_list.Any_SLUG)
        assert session.query(ContentShare).filter(ContentShare.share_id == share_id).one()
        assert (
            session.query(UploadPermission)
            .filter(UploadPermission.upload_permission_id == upload_permission_id)
            .one()
        )
        session.query(Workspace).filter(Workspace.workspace_id == workspace_id).one()

        with unprotected_content_revision(session) as unprotected_session:
            cleanup_lib = CleanupLib(app_config=app_config, session=unprotected_session)
            cleanup_lib.delete_user_associated_data(admin_user)
            session.flush()
        transaction.commit()
        # INFO - G.M - 2019-12-20 - workspace is not deleted by this method
        session.query(Workspace).filter(Workspace.workspace_id == workspace_id).one()
        with pytest.raises(NoResultFound):
            session.query(UserRoleInWorkspace).filter(
                UserRoleInWorkspace.workspace_id == workspace_id
            ).one()
        with pytest.raises(NoResultFound):
            session.query(UploadPermission).filter(
                UploadPermission.workspace_id == workspace_id
            ).one()
        with pytest.raises(ContentNotFound):
            content_api.get_one(folder2_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(ContentNotFound):
            content_api.get_one(folder_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(ContentNotFound):
            content_api.get_one(file_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(ContentNotFound):
            content_api.get_one(comment_id, content_type=content_type_list.Any_SLUG)
        with pytest.raises(NoResultFound):
            session.query(ContentShare).filter(ContentShare.share_id == share_id).one()
        with pytest.raises(NoResultFound):
            session.query(UploadPermission).filter(
                UploadPermission.upload_permission_id == upload_permission_id
            ).one()
        with pytest.raises(NoResultFound):
            session.query(FavoriteContent).filter(
                FavoriteContent.user_id == admin_user.user_id
            ).one()

    def test_unit__delete_revision__ok__delete_last_revision(
        self,
        admin_user,
        session,
        app_config,
        content_type_list,
        content_api_factory,
        workspace_api_factory,
        share_lib_factory,
        upload_permission_lib_factory,
    ) -> None:

        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True
        )
        workspace_api = workspace_api_factory.get()
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        file_ = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            parent=folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=file_):
            content_api.update_file_data(
                file_, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.mark_read(file_)
        file_id = file_.content_id
        revisions = file_.revisions
        session.flush()
        transaction.commit()
        assert len(revisions) == 2
        first_revision_id = revisions[0].revision_id
        second_revision_id = revisions[1].revision_id
        content = content_api.get_one(file_id, content_type=content_type_list.Any_SLUG)
        assert content
        assert content.revision.revision_id == second_revision_id
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.revision_id == first_revision_id)
            .one()
        )
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.revision_id == second_revision_id)
            .one()
        )
        assert (
            session.query(RevisionReadStatus)
            .filter(RevisionReadStatus.revision_id == first_revision_id)
            .one()
        )
        assert (
            session.query(RevisionReadStatus)
            .filter(RevisionReadStatus.revision_id == second_revision_id)
            .one()
        )

        with unprotected_content_revision(session) as unprotected_session:
            cleanup_lib = CleanupLib(app_config=app_config, session=unprotected_session)
            cleanup_lib.delete_revision(revision=revisions[1])
            session.flush()
        transaction.commit()
        assert content
        assert content.revision.revision_id == first_revision_id
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.revision_id == first_revision_id)
            .one()
        )
        with pytest.raises(NoResultFound):
            assert (
                session.query(ContentRevisionRO)
                .filter(ContentRevisionRO.revision_id == second_revision_id)
                .one()
            )
        assert (
            session.query(RevisionReadStatus)
            .filter(RevisionReadStatus.revision_id == first_revision_id)
            .one()
        )
        with pytest.raises(NoResultFound):
            assert (
                session.query(RevisionReadStatus)
                .filter(RevisionReadStatus.revision_id == second_revision_id)
                .one()
            )

    def test_unit__delete_revision__ok__delete_older_revision(
        self,
        admin_user,
        session,
        app_config,
        content_type_list,
        content_api_factory,
        workspace_api_factory,
        share_lib_factory,
        upload_permission_lib_factory,
    ) -> None:

        content_api = content_api_factory.get(
            show_deleted=True, show_active=True, show_archived=True
        )
        workspace_api = workspace_api_factory.get()
        test_workspace = workspace_api.create_workspace("test_workspace")
        session.add(test_workspace)
        folder = content_api.create(
            label="test-folder",
            content_type_slug=content_type_list.Folder.slug,
            workspace=test_workspace,
            do_save=True,
            do_notify=False,
        )
        file_ = content_api.create(
            content_type_slug=content_type_list.File.slug,
            workspace=test_workspace,
            parent=folder,
            label="Test file",
            do_save=True,
            do_notify=False,
        )
        with new_revision(session=session, tm=transaction.manager, content=file_):
            content_api.update_file_data(
                file_, "Test_file.txt", new_mimetype="plain/text", new_content=b"Test file"
            )
        content_api.mark_read(file_)
        file_id = file_.content_id
        revisions = file_.revisions
        session.flush()
        transaction.commit()
        assert len(revisions) == 2
        first_revision_id = revisions[0].revision_id
        second_revision_id = revisions[1].revision_id
        content = content_api.get_one(file_id, content_type=content_type_list.Any_SLUG)
        assert content
        assert content.revision.revision_id == second_revision_id
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.revision_id == first_revision_id)
            .one()
        )
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.revision_id == second_revision_id)
            .one()
        )
        assert (
            session.query(RevisionReadStatus)
            .filter(RevisionReadStatus.revision_id == first_revision_id)
            .one()
        )
        assert (
            session.query(RevisionReadStatus)
            .filter(RevisionReadStatus.revision_id == second_revision_id)
            .one()
        )

        with unprotected_content_revision(session) as unprotected_session:
            cleanup_lib = CleanupLib(app_config=app_config, session=unprotected_session)
            cleanup_lib.delete_revision(revision=revisions[0])
            session.flush()
        transaction.commit()
        assert content
        assert content.revision.revision_id == second_revision_id
        assert (
            session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.revision_id == second_revision_id)
            .one()
        )
        with pytest.raises(NoResultFound):
            assert (
                session.query(ContentRevisionRO)
                .filter(ContentRevisionRO.revision_id == first_revision_id)
                .one()
            )
        assert (
            session.query(RevisionReadStatus)
            .filter(RevisionReadStatus.revision_id == second_revision_id)
            .one()
        )
        with pytest.raises(NoResultFound):
            assert (
                session.query(RevisionReadStatus)
                .filter(RevisionReadStatus.revision_id == first_revision_id)
                .one()
            )

    def test_safe_update__ok__nominal_case(self, session, app_config, admin_user) -> None:
        assert session.query(Workspace).all() == []
        cleanup_lib = CleanupLib(app_config=app_config, session=session, dry_run_mode=False)
        test_workspace = Workspace()
        test_workspace.owner_id = admin_user.user_id
        cleanup_lib.safe_update(test_workspace)
        transaction.commit()
        assert session.query(Workspace).one() == test_workspace

    def test_safe_update__ok__dry_run(self, session, app_config, admin_user) -> None:
        assert session.query(Workspace).all() == []
        cleanup_lib = CleanupLib(app_config=app_config, session=session, dry_run_mode=True)
        test_workspace = Workspace()
        test_workspace.owner_id = admin_user.user_id
        cleanup_lib.safe_update(test_workspace)
        transaction.commit()
        with pytest.raises(NoResultFound):
            assert session.query(Workspace).one() == test_workspace

    def test_safe_delete__ok__nominal_case(self, session, app_config, admin_user) -> None:
        assert session.query(Workspace).all() == []
        cleanup_lib = CleanupLib(app_config=app_config, session=session, dry_run_mode=False)
        test_workspace = Workspace()
        test_workspace.owner_id = admin_user.user_id
        session.add(test_workspace)
        transaction.commit()
        cleanup_lib.safe_delete(test_workspace)
        transaction.commit()
        with pytest.raises(NoResultFound):
            assert session.query(Workspace).one() == test_workspace

    def test_safe_delete__ok__dry_run(self, session, app_config, admin_user) -> None:
        assert session.query(Workspace).all() == []
        cleanup_lib = CleanupLib(app_config=app_config, session=session, dry_run_mode=True)
        test_workspace = Workspace()
        test_workspace.owner_id = admin_user.user_id
        session.add(test_workspace)
        transaction.commit()
        cleanup_lib.safe_delete(test_workspace)
        transaction.commit()
        assert session.query(Workspace).one() == test_workspace

    def test_safe_delete_dir__ok__nominal_case(self, session, app_config, admin_user) -> None:
        assert session.query(Workspace).all() == []
        cleanup_lib = CleanupLib(app_config=app_config, session=session, dry_run_mode=False)
        dir_path = tempfile.mkdtemp()
        file_path = "{}/my_file.txt".format(dir_path)
        Path(file_path).touch()
        assert Path(dir_path).is_dir()
        assert Path(file_path).is_file()
        cleanup_lib.safe_delete_dir(dir_path)
        assert not Path(dir_path).exists()
        assert not Path(file_path).exists()

    def test_safe_delete_dir__ok__dry_run(self, session, app_config, admin_user) -> None:
        assert session.query(Workspace).all() == []
        cleanup_lib = CleanupLib(app_config=app_config, session=session, dry_run_mode=True)
        dir_path = tempfile.mkdtemp()
        file_path = "{}/my_file.txt".format(dir_path)
        Path(file_path).touch()
        assert Path(dir_path).is_dir()
        assert Path(file_path).is_file()
        cleanup_lib.safe_delete_dir(dir_path)
        assert Path(dir_path).is_dir()
        assert Path(file_path).is_file()
