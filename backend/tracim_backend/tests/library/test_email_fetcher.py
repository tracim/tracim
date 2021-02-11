from email.message import Message

from mock import MagicMock
from mock import Mock
import pytest
import responses

from tracim_backend.exceptions import AutoReplyEmailNotAllowed
from tracim_backend.exceptions import BadStatusCode
from tracim_backend.lib.mail_fetcher.email_fetcher import DecodedMail
from tracim_backend.lib.mail_fetcher.email_fetcher import MailFetcher


class TestDecodedMail(object):
    def test_unit__decoded_mail__check_validity_for_comment_content__ok__nominal_case(self):
        message = Message()
        uid = 1
        decodedmail = DecodedMail(message, uid)
        try:
            decodedmail.check_validity_for_comment_content()
        except AutoReplyEmailNotAllowed:
            pytest.fail("mail is seen as autoreply mail but it is not")

    @pytest.mark.parametrize(
        "header_name, header_value",
        [
            # header_name, header_value
            ("Auto-submitted", "auto-replied"),
            ("Auto-submitted", "auto-replied (rejected)"),
            ("Auto-submitted", "auto-replied (vacation)"),
            ("Precedence", "auto_reply"),
            ("X-Autoreply", "yes"),
            ("X-Auto-Response-Suppress", "DR"),
            ("X-Auto-Response-Suppress", "All"),
            ("X-Auto-Response-Suppress", "autoreply"),
            ("X-Auto-Response-Suppress", "a,DR,z"),
            ("X-Auto-Response-Suppress", "a,autoreply,z"),
            ("X-Auto-Response-Suppress", "a,all,z"),
            ("X-Auto-Response-Suppress", "DR,All,Autoreply"),
        ],
    )
    def test_unit__decoded_mail__check_validity_for_comment_content__err__is_autoreply_email(
        self, header_name, header_value
    ):
        message = Message()
        message.add_header(header_name, header_value)

        uid = 1
        decodedmail = DecodedMail(message, uid)
        with pytest.raises(AutoReplyEmailNotAllowed):
            decodedmail.check_validity_for_comment_content()

    def test_unit__find_key_from_mail_address__subadress_no_key(self):
        mail_address = "reply@mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="reply+{key}@mydomainname.tld"
            )
            is None
        )

    def test_unit__find_key_from_mail_subadress_adress_key(self):
        mail_address = "reply+12@mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="reply+{key}@mydomainname.tld"
            )
            == "12"
        )

    def test_unit__find_key_from_mail_subadress__err_not_alphanum(self):
        mail_address = "reply+%@mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="reply+{key}@mydomainname.tld"
            )
            is None
        )

    def test_unit__find_key_from_mail_address__dot_adress_no_key(self):
        mail_address = "reply@mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="reply.{key}@mydomainname.tld"
            )
            is None
        )

    def test_unit__find_key_from_mail_address__no_key_in_pattern(self):
        """
        Automatically failed to obtain key when pattern as no key
        """
        mail_address = "reply@mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="reply@mydomainname.tld"
            )
            is None
        )

    def test_unit__find_key_from_mail_address__mismatch_pattern(self):
        """
        Automatically failed to obtain key when pattern don't match
        """
        mail_address = "reply+1@mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="toto+{key}@mydomainname.tld"
            )
            is None
        )

    def test_unit__find_key_from_mail_address__multiple_key(self):
        """
        Automatically failed to obtain key when pattern as multiple key.
        """
        mail_address = "key.reply.key@mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="{key}reply{key}@mydomainname.tld"
            )
            is None
        )

    def test_unit__find_key_from_mail_dot_adress_key(self):
        mail_address = "reply.key@mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="reply.{key}@mydomainname.tld"
            )
            == "key"
        )

    def test_unit__find_key_from_mail_address__explicit_subadress_no_key(self):
        mail_address = "reply+cid@mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="z+cid{key}@b"
            )
            is None
        )

    def test_unit__find_key_from_mail_explicit_subadress_key(self):
        mail_address = "reply+cid12@mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="reply+cid{key}@mydomainname.tld"
            )
            == "12"
        )

    def test_unit__find_key_from_mail_address__adress(self):
        mail_address = "12@reply.mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="{key}@reply.mydomainname.tld"
            )
            == "12"
        )

    def test_unit__find_key_from_mail_address__adress_explicit_key(self):
        mail_address = "cid12@reply.mydomainname.tld"
        assert (
            DecodedMail.find_key_from_mail_address(
                mail_address, marker_str="{key}", pattern="cid{key}@reply.mydomainname.tld"
            )
            == "12"
        )


class TestMailFetcher(object):
    def test_unit__stop__ok__nominal_test(self):
        mf = MailFetcher(
            host="host_imap",
            port="993",
            use_ssl=True,
            password="imap_password",
            folder="INBOX",
            use_idle=True,
            use_html_parsing=True,
            use_txt_parsing=True,
            lockfile_path="email_fetcher.lock",
            api_base_url="http://127.0.0.1:6543/api",
            burst=True,
            api_key="apikey",
            connection_max_lifetime=60,
            heartbeat=60,
            reply_to_pattern="",
            references_pattern="",
            user="imap_user",
        )
        assert mf._is_active
        mf.stop()
        assert not mf._is_active

    def test_unit__get_auth_headers__ok__nominal_test(self):
        mf = MailFetcher(
            host="host_imap",
            port="993",
            use_ssl=True,
            password="imap_password",
            folder="INBOX",
            use_idle=True,
            use_html_parsing=True,
            use_txt_parsing=True,
            lockfile_path="email_fetcher.lock",
            api_base_url="http://127.0.0.1:6543/api",
            burst=True,
            api_key="apikey",
            reply_to_pattern="",
            references_pattern="",
            connection_max_lifetime=60,
            heartbeat=60,
            user="imap_user",
        )
        headers = mf._get_auth_headers("mymailadress@mydomain.com")
        assert "Tracim-Api-Key" in headers
        assert "Tracim-Api-Login" in headers
        assert headers["Tracim-Api-Key"] == "apikey"
        assert headers["Tracim-Api-Login"] == "mymailadress@mydomain.com"

    @responses.activate
    def test_unit___get_content_info__err_403__no_right_to_see(self):
        content_json = {"code": None, "details": {"error_detail": {}}, "message": "more info..."}

        responses.add(
            responses.GET, "http://127.0.0.1:6543/api/contents/1", json=content_json, status=403
        )
        mf = MailFetcher(
            host="host_imap",
            port="993",
            use_ssl=True,
            password="imap_password",
            folder="INBOX",
            use_idle=True,
            use_html_parsing=True,
            use_txt_parsing=True,
            lockfile_path="email_fetcher.lock",
            api_base_url="http://127.0.0.1:6543/api/",
            burst=True,
            api_key="apikey",
            connection_max_lifetime=60,
            heartbeat=60,
            reply_to_pattern="",
            references_pattern="",
            user="imap_user",
        )
        auth_headers = {"Tracim-Api-Key": "apikey", "Tracim-Api-Login": "mymailadress@mydomain.com"}
        mock = Mock()
        mock.return_value = auth_headers
        mf._get_auth_headers = mock

        with pytest.raises(BadStatusCode):
            mf._get_content_info(1, user_email="useremailaddrees@mydomain.com")

    @responses.activate
    def test_unit___get_content_info__ok__nominal_test(self):
        content_json = {
            "author": {"has_avatar": False, "public_name": "Global manager", "user_id": 1},
            "content_id": 1,
            "content_type": "thread",
            "created": "2018-08-24T15:00:08Z",
            "current_revision_id": 29,
            "is_archived": False,
            "is_deleted": False,
            "label": "coucou",
            "last_modifier": {"has_avatar": False, "public_name": "Global manager", "user_id": 1},
            "modified": "2018-08-24T15:00:08Z",
            "parent_id": None,
            "raw_content": "",
            "show_in_ui": True,
            "slug": "coucou",
            "status": "open",
            "sub_content_types": ["comment"],
            "workspace_id": 4,
        }

        responses.add(
            responses.GET, "http://127.0.0.1:6543/api/contents/1", json=content_json, status=200
        )
        mf = MailFetcher(
            host="host_imap",
            port="993",
            use_ssl=True,
            password="imap_password",
            folder="INBOX",
            use_idle=True,
            use_html_parsing=True,
            use_txt_parsing=True,
            lockfile_path="email_fetcher.lock",
            api_base_url="http://127.0.0.1:6543/api/",
            burst=True,
            api_key="apikey",
            connection_max_lifetime=60,
            heartbeat=60,
            reply_to_pattern="",
            references_pattern="",
            user="imap_user",
        )
        auth_headers = {"Tracim-Api-Key": "apikey", "Tracim-Api-Login": "mymailadress@mydomain.com"}
        mock = Mock()
        mock.return_value = auth_headers
        mf._get_auth_headers = mock
        content_info = mf._get_content_info(1, user_email="useremailaddress@mydomain.com")
        assert content_info == content_json

    def test_unit__create_comment_request__ok__nominal_test(self):
        mail = Mock()
        mail.get_body.return_value = "CONTENT"
        mail.get_key.return_value = "1"
        mail.get_from_address.return_value = "useremailaddress@mydomain.com"

        content_info = {
            "author": {"has_avatar": False, "public_name": "Global manager", "user_id": 1},
            "content_id": 1,
            "content_type": "thread",
            "created": "2018-08-24T15:00:08Z",
            "current_revision_id": 29,
            "is_archived": False,
            "is_deleted": False,
            "label": "coucou",
            "last_modifier": {"has_avatar": False, "public_name": "Global manager", "user_id": 1},
            "modified": "2018-08-24T15:00:08Z",
            "parent_id": None,
            "raw_content": "",
            "show_in_ui": True,
            "slug": "coucou",
            "status": "open",
            "sub_content_types": ["comment"],
            "workspace_id": 4,
        }

        mf = MailFetcher(
            host="host_imap",
            port="993",
            use_ssl=True,
            password="imap_password",
            folder="INBOX",
            use_idle=True,
            use_html_parsing=True,
            use_txt_parsing=True,
            lockfile_path="email_fetcher.lock",
            api_base_url="http://127.0.0.1:6543/api/",
            burst=True,
            api_key="apikey",
            connection_max_lifetime=60,
            heartbeat=60,
            reply_to_pattern="",
            references_pattern="",
            user="imap_user",
        )
        mf._get_content_info = Mock()
        mf._get_content_info.return_value = content_info
        method, endpoint, body = mf._create_comment_request(mail)
        assert method == "POST"
        assert endpoint == "http://127.0.0.1:6543/api/workspaces/4/contents/1/comments"
        assert body == {"raw_content": "CONTENT"}

    @responses.activate
    def test_unit__send_request__ok__nominal_case(self):
        content_json = {
            "author": {"has_avatar": False, "public_name": "John Doe", "user_id": 3},
            "content_id": 2,
            "created": "2018-08-27T12:12:23.807Z",
            "parent_id": 1,
            "raw_content": "<p>This is just an html comment !</p>",
        }
        responses.add(
            responses.POST,
            "http://127.0.0.1:6543/api/workspaces/4/contents/1/comments",
            status=200,
            json=content_json,
        )
        mf = MailFetcher(
            host="host_imap",
            port="993",
            use_ssl=True,
            password="imap_password",
            folder="INBOX",
            use_idle=True,
            use_html_parsing=True,
            use_txt_parsing=True,
            lockfile_path="email_fetcher.lock",
            api_base_url="http://127.0.0.1:6543/api/",
            burst=True,
            api_key="apikey",
            connection_max_lifetime=60,
            heartbeat=60,
            reply_to_pattern="",
            references_pattern="",
            user="imap_user",
        )
        imapc_mock = MagicMock()
        imapc_mock_add_flags = MagicMock()
        imapc_mock.add_flags = imapc_mock_add_flags
        email_mock = MagicMock()
        auth_headers = {"Tracim-Api-Key": "apikey", "Tracim-Api-Login": "mymailadress@mydomain.com"}
        header_mock = Mock()
        header_mock.return_value = auth_headers
        mf._get_auth_headers = header_mock
        mf._send_request(
            endpoint="http://127.0.0.1:6543/api/workspaces/4/contents/1/comments",
            json_body_dict={"raw_content": "CONTENT"},
            method="POST",
            imapc=imapc_mock,
            mail=email_mock,
        )

        assert imapc_mock_add_flags.call_count == 2

    def test_unit__notify_tracim(self):
        mf = MailFetcher(
            host="host_imap",
            port="993",
            use_ssl=True,
            password="imap_password",
            folder="INBOX",
            use_idle=True,
            use_html_parsing=True,
            use_txt_parsing=True,
            lockfile_path="email_fetcher.lock",
            api_base_url="http://127.0.0.1:6543/api/",
            burst=True,
            api_key="apikey",
            connection_max_lifetime=60,
            heartbeat=60,
            reply_to_pattern="",
            references_pattern="",
            user="imap_user",
        )
        imapc_mock = MagicMock()
        imapc_mock_add_flags = MagicMock()
        imapc_mock.add_flags = imapc_mock_add_flags
        mail = Mock()
        mail.get_body.return_value = "CONTENT"
        mail.get_key.return_value = "1"
        mail.get_from_address.return_value = "useremailaddress@mydomain.com"
        mail2 = Mock()
        mail2.get_body.return_value = "CONTENT2"
        mail2.get_key.return_value = "2"
        mail2.get_from_address.return_value = "useremailaddress2@mydomain.com"
        mails = [mail, mail2]
        mf._send_request = Mock()
        mf._create_comment_request = Mock()
        mf._create_comment_request.side_effect = [
            (
                "POST",
                "http://127.0.0.1:6543/api/workspaces/4/contents/1/comments",
                {"raw_content": "CONTENT"},
            ),
            (
                "POST",
                "http://127.0.0.1:6543/api/workspaces/4/contents/2/comments",
                {"raw_content": "CONTENT2"},
            ),
        ]
        mf._notify_tracim(mails=mails, imapc=imapc_mock)
        assert mf._send_request.call_count == 2
