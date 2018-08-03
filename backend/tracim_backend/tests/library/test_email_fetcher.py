from tracim_backend.lib.mail_fetcher.email_fetcher import DecodedMail


class TestDecodedMail(object):
    def test_unit__find_key_from_mail_address_no_key(self):
        mail_address = "a@b"
        assert DecodedMail.find_key_from_mail_address(mail_address) is None

    def test_unit__find_key_from_mail_adress_key(self):
        mail_address = "a+key@b"
        assert DecodedMail.find_key_from_mail_address(mail_address) == 'key'
