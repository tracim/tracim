import pytest

from tracim_backend.lib.mail_fetcher.daemon import MailFetcherDaemon
from tracim_backend.lib.mail_notifier.daemon import MailSenderDaemon
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize("config_section", [{"name": "mail_test_async"}], indirect=True)
class TestMailNotifyDaemon(object):
    @pytest.mark.mail
    def test_func__create_user_with_mail_notification__ok__nominal_case(
        self, user_api_factory, mailhog, app_config
    ):
        api = user_api_factory.get()
        u = api.create_user(
            email="bob@bob",
            password="password",
            name="bob",
            timezone="+2",
            do_save=True,
            do_notify=True,
        )
        assert u is not None
        assert u.email == "bob@bob"
        assert u.validate_password("password")
        assert u.display_name == "bob"
        assert u.timezone == "+2"

        # Send mail async from redis queue with daemon
        daemon = MailSenderDaemon(app_config, burst=True)
        daemon.run()
        # check mail received
        response = mailhog.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Global manager via Tracim <test_user_from+1@localhost>"
        assert headers["To"][0] == "bob <bob@bob>"
        assert headers["Subject"][0] == "[Tracim] Created account"

    @pytest.mark.mail
    def test_func__create_new_content_with_notification__ok__nominal_case(
        self,
        app_config,
        user_api_factory,
        mailhog,
        workspace_api_factory,
        content_api_factory,
        content_type_list,
    ):
        uapi = user_api_factory.get()
        current_user = uapi.get_one_by_email("admin@admin.admin")
        # Create new user with notification enabled on w1 workspace
        wapi = workspace_api_factory.get(current_user=current_user)
        workspace = wapi.get_one_by_filemanager_filename("Recipes.space")
        user = uapi.get_one_by_email("bob@fsf.local")
        wapi.enable_notifications(user, workspace)

        api = content_api_factory.get(current_user=user)
        item = api.create(
            content_type_list.Folder.slug, workspace, None, "parent", do_save=True, do_notify=False
        )
        api.create(
            content_type_list.File.slug, workspace, item, "file1", do_save=True, do_notify=True
        )
        # Send mail async from redis queue with daemon
        daemon = MailSenderDaemon(app_config, burst=True)
        daemon.run()
        # check mail received
        response = mailhog.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == '"Bob i. via Tracim" <test_user_from+3@localhost>'
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[Tracim] [Recipes] file1 (Opened)"
        assert headers["References"][0] == "<test_user_refs+22@localhost>"
        assert (
            headers["Reply-to"][0]
            == '"Bob i. & all members of Recipes" <test_user_reply+22@localhost>'
        )


class TestMailFetcherDaemon(object):
    @pytest.mark.mail
    def test_func__mail_fetcher_daemon__ok__run(self, app_config):
        """
        simple test to check only if mail fetcher daemon can be runned without
        raising exception, particularly attribute error related to bad config
        parameter naming
        """
        try:
            mail_fetcher = MailFetcherDaemon(config=app_config, burst=True)
            mail_fetcher.run()
        except AttributeError:
            pytest.fail("Mail Fetcher raise attribute error")


class TestMailSenderDaemon(object):
    @pytest.mark.mail
    def test_func__mail_sender_daemon__ok__run(self, app_config):
        """
        simple test to check only if mail notifier daemonc an be runned without
        raising exception, particularly attribute error related to bad config
        parameter naming
        """
        try:
            mail_fetcher = MailSenderDaemon(config=app_config, burst=True)
            mail_fetcher.run()
        except AttributeError:
            pytest.fail("Mail sender raise attribute error")
