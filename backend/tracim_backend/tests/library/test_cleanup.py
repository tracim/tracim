import pytest
from sqlalchemy.orm.exc import NoResultFound
import transaction

from tracim_backend import ContentNotFound
from tracim_backend.applications.share.models import ContentShare
from tracim_backend.lib.cleanup.cleanup import CleanupLib
from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.tracim_session import unprotected_content_revision
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
class TestCleanupLib(object):
    def test_unit__anonymise_user__ok__nominal_case(self, session, app_config) -> None:
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.display_name == "bob"
        assert u.email == "bob@bob"
        cleanup_lib = CleanupLib(app_config=app_config, session=session)
        cleanup_lib.anonymise_user(u)
        assert u.display_name == "Lost Meerkat"
        assert u.email.endswith("@anonymous.local")

    def test_unit__anonymise_user__ok__explicit_name(self, session, app_config) -> None:
        api = UserApi(current_user=None, session=session, config=app_config)
        u = api.create_minimal_user("bob@bob")
        assert u.display_name == "bob"
        assert u.email == "bob@bob"
        cleanup_lib = CleanupLib(app_config=app_config, session=session)
        cleanup_lib.anonymise_user(u, anonymised_user_display_name="anonymous")
        assert u.display_name == "anonymous"
        assert u.email.endswith("@anonymous.local")

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
