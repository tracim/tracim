# coding=utf-8
# INFO - G.M - 09-06-2018 - Those test need a working MailHog

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import pytest
from rq import SimpleWorker
import transaction

from tracim_backend.lib.mail_notifier.sender import EmailSender
from tracim_backend.lib.mail_notifier.utils import SmtpConfiguration
from tracim_backend.lib.utils.utils import get_redis_connection
from tracim_backend.lib.utils.utils import get_rq_queue
from tracim_backend.tests.fixtures import *  # noqa: F403,F40


@pytest.mark.parametrize("config_section", [{"name": "mail_test"}], indirect=True)
class TestEmailSender(object):
    def test__func__connect_disconnect__ok__nominal_case(self, app_config, mailhog):
        smtp_config = SmtpConfiguration(
            app_config.EMAIL__NOTIFICATION__SMTP__SERVER,
            app_config.EMAIL__NOTIFICATION__SMTP__PORT,
            app_config.EMAIL__NOTIFICATION__SMTP__USER,
            app_config.EMAIL__NOTIFICATION__SMTP__PASSWORD,
        )
        sender = EmailSender(app_config, smtp_config, True)
        sender.connect()
        sender.disconnect()

    def test__func__send_email__ok__nominal_case(self, app_config, mailhog):
        smtp_config = SmtpConfiguration(
            app_config.EMAIL__NOTIFICATION__SMTP__SERVER,
            app_config.EMAIL__NOTIFICATION__SMTP__PORT,
            app_config.EMAIL__NOTIFICATION__SMTP__USER,
            app_config.EMAIL__NOTIFICATION__SMTP__PASSWORD,
        )
        sender = EmailSender(app_config, smtp_config, True)

        # Create test_mail
        msg = MIMEMultipart()
        msg["Subject"] = "test__func__send_email__ok__nominal_case"
        msg["From"] = "test_send_mail@localhost"
        msg["To"] = "receiver_test_send_mail@localhost"
        text = "test__func__send_email__ok__nominal_case"
        html = """\
        <html>
          <head></head>
          <body>
            <p>test__func__send_email__ok__nominal_case</p>
          </body>
        </html>
        """.replace(
            " ", ""
        ).replace(
            "\n", ""
        )
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        msg.attach(part1)
        msg.attach(part2)

        sender.send_mail(msg)
        sender.disconnect()

        # check mail received
        response = mailhog.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "test_send_mail@localhost"
        assert headers["To"][0] == "receiver_test_send_mail@localhost"
        assert headers["Subject"][0] == "test__func__send_email__ok__nominal_case"
        assert response[0]["MIME"]["Parts"][0]["Body"] == text
        assert response[0]["MIME"]["Parts"][1]["Body"] == html


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize("config_section", [{"name": "mail_test"}], indirect=True)
class TestNotificationsSync(object):
    def test_func__create_user_with_mail_notification__ok__nominal_case(
        self, user_api_factory, mailhog
    ):
        api = user_api_factory.get()
        u = api.create_user(
            email="bob@bob",
            password="password",
            name="bob",
            timezone="+2",
            lang="fr",
            do_save=True,
            do_notify=True,
        )
        assert u is not None
        assert u.email == "bob@bob"
        assert u.validate_password("password")
        assert u.display_name == "bob"
        assert u.timezone == "+2"

        # check mail received
        response = mailhog.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "bob <bob@bob>"
        assert headers["Subject"][0] == "[TRACIM] Created account"

    def test_func__create_new_content_with_notification__ok__nominal_case(
        self,
        user_api_factory,
        workspace_api_factory,
        content_api_factory,
        mailhog,
        content_type_list,
    ):
        uapi = user_api_factory.get(current_user=None)
        current_user = uapi.get_one_by_email("admin@admin.admin")
        # set admin as french, useful to verify if i18n work properly
        current_user.lang = "fr"
        # Create new user with notification enabled on w1 workspace
        wapi = workspace_api_factory.get(current_user=current_user)
        workspace = wapi.get_one_by_label("Recipes")
        user = uapi.get_one_by_email("bob@fsf.local")
        wapi.enable_notifications(user, workspace)

        api = content_api_factory.get(current_user=user)
        item = api.create(
            content_type_list.Folder.slug, workspace, None, "parent", do_save=True, do_notify=False
        )
        api.create(
            content_type_list.File.slug, workspace, item, "file1", do_save=True, do_notify=True
        )

        # check mail received
        response = mailhog.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == '"Bob i. via Tracim" <test_user_from+3@localhost>'
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[TRACIM] [Recipes] file1 (Open)"
        assert headers["References"][0] == "test_user_refs+22@localhost"
        assert (
            headers["Reply-to"][0]
            == '"Bob i. & all members of Recipes" <test_user_reply+22@localhost>'
        )

    def test_func__create_comment_with_notification__ok__nominal_case(
        self,
        user_api_factory,
        workspace_api_factory,
        content_api_factory,
        mailhog,
        content_type_list,
    ):
        uapi = user_api_factory.get(current_user=None)
        current_user = uapi.get_one_by_email("admin@admin.admin")
        # set admin as french, useful to verify if i18n work properly
        current_user.lang = "fr"
        # Create new user with notification enabled on w1 workspace
        wapi = workspace_api_factory.get(current_user=current_user)
        workspace = wapi.get_one_by_label("Recipes")
        user = uapi.get_one_by_email("bob@fsf.local")
        wapi.enable_notifications(user, workspace)

        api = content_api_factory.get(current_user=user)
        item = api.create(
            content_type_list.Folder.slug, workspace, None, "parent", do_save=True, do_notify=False
        )
        item2 = api.create(
            content_type_list.File.slug, workspace, item, "file1", do_save=True, do_notify=False
        )
        api.create_comment(parent=item2, content="My super comment", do_save=True, do_notify=True)
        transaction.commit()

        # check mail received
        response = mailhog.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == '"Bob i. via Tracim" <test_user_from+3@localhost>'
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[TRACIM] [Recipes] file1 (Open)"
        assert headers["References"][0] == "test_user_refs+22@localhost"
        assert (
            headers["Reply-to"][0]
            == '"Bob i. & all members of Recipes" <test_user_reply+22@localhost>'
        )

    def test_func__reset_password__ok__nominal_case(self, user_api_factory, mailhog):
        uapi = user_api_factory.get(current_user=None)
        current_user = uapi.get_one_by_email("admin@admin.admin")
        uapi.reset_password_notification(current_user, do_save=True)
        transaction.commit()
        # check mail received
        response = mailhog.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[TRACIM] A password reset has been requested"


@pytest.mark.usefixtures("base_fixture")
@pytest.mark.usefixtures("default_content_fixture")
@pytest.mark.parametrize("config_section", [{"name": "mail_test_async"}], indirect=True)
class TestNotificationsAsync(object):
    def test_func__create_user_with_mail_notification__ok__nominal_case(
        self, mailhog, user_api_factory, app_config
    ):
        api = user_api_factory.get(current_user=None)
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

        # Send mail async from redis queue
        redis = get_redis_connection(app_config)
        queue = get_rq_queue(redis, "mail_sender")
        worker = SimpleWorker([queue], connection=queue.connection)
        worker.work(burst=True)
        # check mail received
        response = mailhog.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "bob <bob@bob>"
        assert headers["Subject"][0] == "[TRACIM] Created account"

    def test_func__create_new_content_with_notification__ok__nominal_case(
        self,
        user_api_factory,
        workspace_api_factory,
        content_api_factory,
        mailhog,
        app_config,
        content_type_list,
    ):
        uapi = user_api_factory.get(current_user=None)
        current_user = uapi.get_one_by_email("admin@admin.admin")
        # Create new user with notification enabled on w1 workspace
        wapi = workspace_api_factory.get(current_user=current_user)
        workspace = wapi.get_one_by_label("Recipes")
        user = uapi.get_one_by_email("bob@fsf.local")
        wapi.enable_notifications(user, workspace)

        api = content_api_factory.get(current_user=user)
        item = api.create(
            content_type_list.Folder.slug, workspace, None, "parent", do_save=True, do_notify=False
        )
        api.create(
            content_type_list.File.slug, workspace, item, "file1", do_save=True, do_notify=True
        )
        # Send mail async from redis queue
        redis = get_redis_connection(app_config)
        queue = get_rq_queue(redis, "mail_sender")
        worker = SimpleWorker([queue], connection=queue.connection)
        worker.work(burst=True)
        # check mail received
        response = mailhog.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == '"Bob i. via Tracim" <test_user_from+3@localhost>'
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[TRACIM] [Recipes] file1 (Open)"
        assert headers["References"][0] == "test_user_refs+22@localhost"
        assert (
            headers["Reply-to"][0]
            == '"Bob i. & all members of Recipes" <test_user_reply+22@localhost>'
        )

    def test_func__reset_password__ok__nominal_case(self, user_api_factory, mailhog, app_config):
        uapi = user_api_factory.get()
        current_user = uapi.get_one_by_email("admin@admin.admin")
        uapi.reset_password_notification(current_user, do_save=True)
        transaction.commit()
        # Send mail async from redis queue
        redis = get_redis_connection(app_config)
        queue = get_rq_queue(redis, "mail_sender")
        worker = SimpleWorker([queue], connection=queue.connection)
        worker.work(burst=True)
        # check mail received
        response = mailhog.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[TRACIM] A password reset has been requested"
