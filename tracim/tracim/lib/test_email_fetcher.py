from email_fetcher import DecodedMail

# find_key_from_mail_address

def test_find_key_from_mail_address_no_key():
    mail_address="a@b"
    assert DecodedMail.find_key_from_mail_address(mail_address) == None

def test_find_key_from_mail_adress_key():
    mail_address="a+key@b"
    assert DecodedMail.find_key_from_mail_address(mail_address) == 'key'
