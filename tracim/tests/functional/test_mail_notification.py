# coding=utf-8
# INFO - G.M - 09-06-2018 - Those test need a working MailHog

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests
from rq import SimpleWorker

from tracim.fixtures.users_and_groups import Base as BaseFixture
from tracim.fixtures.content import Content as ContentFixture
from tracim.lib.utils.utils import get_redis_connection
from tracim.lib.utils.utils import get_rq_queue
from tracim.models.data import ContentType

from tracim.lib.core.content import ContentApi
from tracim.lib.core.user import UserApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.lib.mail_notifier.sender import EmailSender
from tracim.lib.mail_notifier.utils import SmtpConfiguration
from tracim.tests import MailHogTest


class TestEmailSender(MailHogTest):

    def test__func__connect_disconnect__ok__nominal_case(self):
        smtp_config = SmtpConfiguration(
            self.app_config.EMAIL_NOTIFICATION_SMTP_SERVER,
            self.app_config.EMAIL_NOTIFICATION_SMTP_PORT,
            self.app_config.EMAIL_NOTIFICATION_SMTP_USER,
            self.app_config.EMAIL_NOTIFICATION_SMTP_PASSWORD
        )
        sender = EmailSender(
            self.app_config,
            smtp_config,
            True,
        )
        sender.connect()
        sender.disconnect()

    def test__func__send_email__ok__nominal_case(self):
        smtp_config = SmtpConfiguration(
            self.app_config.EMAIL_NOTIFICATION_SMTP_SERVER,
            self.app_config.EMAIL_NOTIFICATION_SMTP_PORT,
            self.app_config.EMAIL_NOTIFICATION_SMTP_USER,
            self.app_config.EMAIL_NOTIFICATION_SMTP_PASSWORD
        )
        sender = EmailSender(
            self.app_config,
            smtp_config,
            True,
        )

        # Create test_mail
        msg = MIMEMultipart()
        msg['Subject'] = 'test__func__send_email__ok__nominal_case'
        msg['From'] = 'test_send_mail@localhost'
        msg['To'] = 'receiver_test_send_mail@localhost'
        text = "test__func__send_email__ok__nominal_case"
        html = """\
        <html>
          <head></head>
          <body>
            <p>test__func__send_email__ok__nominal_case</p>
          </body>
        </html>
        """.replace(' ', '').replace('\n', '')
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)

        sender.send_mail(msg)
        sender.disconnect()

        # check mail received
        response = requests.get('http://127.0.0.1:8025/api/v1/messages')
        response = response.json()
        headers = response[0]['Content']['Headers']
        assert headers['From'][0] == 'test_send_mail@localhost'
        assert headers['To'][0] == 'receiver_test_send_mail@localhost'
        assert headers['Subject'][0] == 'test__func__send_email__ok__nominal_case'  # nopep8
        assert response[0]['MIME']['Parts'][0]['Body'] == text
        assert response[0]['MIME']['Parts'][1]['Body'] == html


class TestNotificationsSync(MailHogTest):

    fixtures = [BaseFixture, ContentFixture]

    def test_func__create_user_with_mail_notification__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password='pass',
            name='bob',
            timezone='+2',
            do_save=True,
            do_notify=True,
        )
        assert u is not None
        assert u.email == "bob@bob"
        assert u.validate_password('pass')
        assert u.display_name == 'bob'
        assert u.timezone == '+2'

        # check mail received
        response = requests.get('http://127.0.0.1:8025/api/v1/messages')
        response = response.json()
        headers = response[0]['Content']['Headers']
        assert headers['From'][0] == 'Tracim Notifications <test_user_from+0@localhost>'  # nopep8
        assert headers['To'][0] == 'bob <bob@bob>'
        assert headers['Subject'][0] == '[TRACIM] Created account'

    def test_func__create_new_content_with_notification__ok__nominal_case(self):
        uapi = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        current_user = uapi.get_one_by_email('admin@admin.admin')
        # Create new user with notification enabled on w1 workspace
        wapi = WorkspaceApi(
            current_user=current_user,
            session=self.session,
        )
        workspace = wapi.get_one_by_label('w1')
        user = uapi.get_one_by_email('bob@fsf.local')
        wapi.enable_notifications(user, workspace)

        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
        item = api.create(
            ContentType.Folder,
            workspace,
            None,
            'parent',
            do_save=True,
            do_notify=False,
        )
        item2 = api.create(
            ContentType.File,
            workspace,
            item,
            'file1',
            do_save=True,
            do_notify=True,
        )

        # check mail received
        response = requests.get('http://127.0.0.1:8025/api/v1/messages')
        response = response.json()
        headers = response[0]['Content']['Headers']
        assert headers['From'][0] == '"Bob i. via Tracim" <test_user_from+3@localhost>'  # nopep8
        assert headers['To'][0] == 'Global manager <admin@admin.admin>'
        assert headers['Subject'][0] == '[TRACIM] [w1] file1 (open)'
        assert headers['References'][0] == 'test_user_refs+13@localhost'
        assert headers['Reply-to'][0] == '"Bob i. & all members of w1" <test_user_reply+13@localhost>'  # nopep8


class TestNotificationsAsync(MailHogTest):
    fixtures = [BaseFixture, ContentFixture]
    config_section = 'mail_test_async'

    def test_func__create_user_with_mail_notification__ok__nominal_case(self):
        api = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        u = api.create_user(
            email='bob@bob',
            password='pass',
            name='bob',
            timezone='+2',
            do_save=True,
            do_notify=True,
        )
        assert u is not None
        assert u.email == "bob@bob"
        assert u.validate_password('pass')
        assert u.display_name == 'bob'
        assert u.timezone == '+2'

        # Send mail async from redis queue
        redis = get_redis_connection(
            self.app_config
        )
        queue = get_rq_queue(
            redis,
            'mail_sender',
        )
        worker = SimpleWorker([queue], connection=queue.connection)
        worker.work(burst=True)
        # check mail received
        response = requests.get('http://127.0.0.1:8025/api/v1/messages')
        response = response.json()
        headers = response[0]['Content']['Headers']
        assert headers['From'][0] == 'Tracim Notifications <test_user_from+0@localhost>'  # nopep8
        assert headers['To'][0] == 'bob <bob@bob>'
        assert headers['Subject'][0] == '[TRACIM] Created account'

    def test_func__create_new_content_with_notification__ok__nominal_case(self):
        uapi = UserApi(
            current_user=None,
            session=self.session,
            config=self.app_config,
        )
        current_user = uapi.get_one_by_email('admin@admin.admin')
        # Create new user with notification enabled on w1 workspace
        wapi = WorkspaceApi(
            current_user=current_user,
            session=self.session,
        )
        workspace = wapi.get_one_by_label('w1')
        user = uapi.get_one_by_email('bob@fsf.local')
        wapi.enable_notifications(user, workspace)

        api = ContentApi(
            current_user=user,
            session=self.session,
            config=self.app_config,
        )
        item = api.create(
            ContentType.Folder,
            workspace,
            None,
            'parent',
            do_save=True,
            do_notify=False,
        )
        item2 = api.create(
            ContentType.File,
            workspace,
            item,
            'file1',
            do_save=True,
            do_notify=True,
        )
        # Send mail async from redis queue
        redis = get_redis_connection(
            self.app_config
        )
        queue = get_rq_queue(
            redis,
            'mail_sender',
        )
        worker = SimpleWorker([queue], connection=queue.connection)
        worker.work(burst=True)
        # check mail received
        response = requests.get('http://127.0.0.1:8025/api/v1/messages')
        response = response.json()
        headers = response[0]['Content']['Headers']
        assert headers['From'][0] == '"Bob i. via Tracim" <test_user_from+3@localhost>'  # nopep8
        assert headers['To'][0] == 'Global manager <admin@admin.admin>'
        assert headers['Subject'][0] == '[TRACIM] [w1] file1 (open)'
        assert headers['References'][0] == 'test_user_refs+13@localhost'
        assert headers['Reply-to'][0] == '"Bob i. & all members of w1" <test_user_reply+13@localhost>'  # nopep8
