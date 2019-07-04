# coding=utf-8
# INFO - G.M - 09-06-2018 - Those test need a working MailHog

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from rq import SimpleWorker
import transaction

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.fixtures.content import Content as ContentFixture
from tracim_backend.fixtures.users_and_groups import Base as BaseFixture
from tracim_backend.lib.mail_notifier.sender import EmailSender
from tracim_backend.lib.mail_notifier.utils import SmtpConfiguration
from tracim_backend.lib.utils.utils import get_redis_connection
from tracim_backend.lib.utils.utils import get_rq_queue
from tracim_backend.tests import MailHogTest


class TestEmailSender(MailHogTest):
    def test__func__connect_disconnect__ok__nominal_case(self):
        smtp_config = SmtpConfiguration(
            self.app_config.EMAIL__NOTIFICATION__SMTP__SERVER,
            self.app_config.EMAIL__NOTIFICATION__SMTP__PORT,
            self.app_config.EMAIL__NOTIFICATION__SMTP__USER,
            self.app_config.EMAIL__NOTIFICATION__SMTP__PASSWORD,
        )
        sender = EmailSender(self.app_config, smtp_config, True)
        sender.connect()
        sender.disconnect()

    def test__func__send_email__ok__nominal_case(self):
        smtp_config = SmtpConfiguration(
            self.app_config.EMAIL__NOTIFICATION__SMTP__SERVER,
            self.app_config.EMAIL__NOTIFICATION__SMTP__PORT,
            self.app_config.EMAIL__NOTIFICATION__SMTP__USER,
            self.app_config.EMAIL__NOTIFICATION__SMTP__PASSWORD,
        )
        sender = EmailSender(self.app_config, smtp_config, True)

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
        response = self.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "test_send_mail@localhost"
        assert headers["To"][0] == "receiver_test_send_mail@localhost"
        assert headers["Subject"][0] == "test__func__send_email__ok__nominal_case"
        assert response[0]["MIME"]["Parts"][0]["Body"] == text
        assert response[0]["MIME"]["Parts"][1]["Body"] == html


class TestNotificationsSync(MailHogTest):

    fixtures = [BaseFixture, ContentFixture]

    def test_func__create_user_with_mail_notification__ok__nominal_case(self):
        api = self.get_user_api(current_user=None)
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
        response = self.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "bob <bob@bob>"
        assert headers["Subject"][0] == "[TRACIM] Created account"

    def test_func__create_new_content_with_notification__ok__nominal_case(self):
        uapi = self.get_user_api(current_user=None)
        current_user = uapi.get_one_by_email("admin@admin.admin")
        # set admin as french, useful to verify if i18n work properly
        current_user.lang = "fr"
        # Create new user with notification enabled on w1 workspace
        wapi = self.get_workspace_api(current_user=current_user)
        workspace = wapi.get_one_by_label("Recipes")
        user = uapi.get_one_by_email("bob@fsf.local")
        wapi.enable_notifications(user, workspace)

        api = self.get_content_api(current_user=user)
        item = api.create(
            content_type_list.Folder.slug, workspace, None, "parent", do_save=True, do_notify=False
        )
        api.create(
            content_type_list.File.slug, workspace, item, "file1", do_save=True, do_notify=True
        )

        # check mail received
        response = self.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == '"Bob i. via Tracim" <test_user_from+3@localhost>'
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[TRACIM] [Recipes] file1 (Open)"
        assert headers["References"][0] == "test_user_refs+22@localhost"
        assert (
            headers["Reply-to"][0]
            == '"Bob i. & all members of Recipes" <test_user_reply+22@localhost>'
        )

    def test_func__create_comment_with_notification__ok__nominal_case(self):
        uapi = self.get_user_api(current_user=None)
        current_user = uapi.get_one_by_email("admin@admin.admin")
        # set admin as french, useful to verify if i18n work properly
        current_user.lang = "fr"
        # Create new user with notification enabled on w1 workspace
        wapi = self.get_workspace_api(current_user=current_user)
        workspace = wapi.get_one_by_label("Recipes")
        user = uapi.get_one_by_email("bob@fsf.local")
        wapi.enable_notifications(user, workspace)

        api = self.get_content_api(current_user=user)
        item = api.create(
            content_type_list.Folder.slug, workspace, None, "parent", do_save=True, do_notify=False
        )
        item2 = api.create(
            content_type_list.File.slug, workspace, item, "file1", do_save=True, do_notify=False
        )
        api.create_comment(parent=item2, content="My super comment", do_save=True, do_notify=True)
        transaction.commit()

        # check mail received
        response = self.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == '"Bob i. via Tracim" <test_user_from+3@localhost>'
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[TRACIM] [Recipes] file1 (Open)"
        assert headers["References"][0] == "test_user_refs+22@localhost"
        assert (
            headers["Reply-to"][0]
            == '"Bob i. & all members of Recipes" <test_user_reply+22@localhost>'
        )

    def test_func__reset_password__ok__nominal_case(self):
        uapi = self.get_user_api(current_user=None)
        current_user = uapi.get_one_by_email("admin@admin.admin")
        uapi.reset_password_notification(current_user, do_save=True)
        transaction.commit()
        # check mail received
        response = self.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[TRACIM] A password reset has been requested"


class TestNotificationsAsync(MailHogTest):
    fixtures = [BaseFixture, ContentFixture]
    config_section = "mail_test_async"

    def test_func__create_user_with_mail_notification__ok__nominal_case(self):
        api = self.get_user_api(current_user=None)
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
        redis = get_redis_connection(self.app_config)
        queue = get_rq_queue(redis, "mail_sender")
        worker = SimpleWorker([queue], connection=queue.connection)
        worker.work(burst=True)
        # check mail received
        response = self.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "bob <bob@bob>"
        assert headers["Subject"][0] == "[TRACIM] Created account"

    def test_func__create_new_content_with_notification__ok__nominal_case(self):
        uapi = self.get_user_api(current_user=None)
        current_user = uapi.get_one_by_email("admin@admin.admin")
        # Create new user with notification enabled on w1 workspace
        wapi = self.get_workspace_api(current_user=current_user)
        workspace = wapi.get_one_by_label("Recipes")
        user = uapi.get_one_by_email("bob@fsf.local")
        wapi.enable_notifications(user, workspace)

        api = self.get_content_api(current_user=user)
        item = api.create(
            content_type_list.Folder.slug, workspace, None, "parent", do_save=True, do_notify=False
        )
        api.create(
            content_type_list.File.slug, workspace, item, "file1", do_save=True, do_notify=True
        )
        # Send mail async from redis queue
        redis = get_redis_connection(self.app_config)
        queue = get_rq_queue(redis, "mail_sender")
        worker = SimpleWorker([queue], connection=queue.connection)
        worker.work(burst=True)
        # check mail received
        response = self.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == '"Bob i. via Tracim" <test_user_from+3@localhost>'
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[TRACIM] [Recipes] file1 (Open)"
        assert headers["References"][0] == "test_user_refs+22@localhost"
        assert (
            headers["Reply-to"][0]
            == '"Bob i. & all members of Recipes" <test_user_reply+22@localhost>'
        )

    def test_func__reset_password__ok__nominal_case(self):
        uapi = self.get_user_api(current_user=None)
        current_user = uapi.get_one_by_email("admin@admin.admin")
        uapi.reset_password_notification(current_user, do_save=True)
        transaction.commit()
        # Send mail async from redis queue
        redis = get_redis_connection(self.app_config)
        queue = get_rq_queue(redis, "mail_sender")
        worker = SimpleWorker([queue], connection=queue.connection)
        worker.work(burst=True)
        # check mail received
        response = self.get_mailhog_mails()
        headers = response[0]["Content"]["Headers"]
        assert headers["From"][0] == "Tracim Notifications <test_user_from+0@localhost>"
        assert headers["To"][0] == "Global manager <admin@admin.admin>"
        assert headers["Subject"][0] == "[TRACIM] A password reset has been requested"
