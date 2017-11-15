from email_fetcher import decode_mail, get_tracim_content_key,\
    TRACIM_SPECIAL_KEY_HEADER,find_key_from_mail_adress
from email.mime.multipart import MIMEMultipart
from email.utils import parsedate_tz,mktime_tz
import datetime

# decode_mail

def test_decode_mail_ok():
    msg = MIMEMultipart()
    msg['From'] = 'a@home'
    msg['To'] = 'b@home'
    msg['Subject'] = "test"
    #msg.add_header('Reply-To', '<a+key@home>')
    msg.add_header('References', '<reply+key@home>')
    msg.add_header('Message-ID', '<uniquevalue@home>')
    msg.add_header('Date', 'Wed, 8 Nov 2017 15:21:10 +0100')
    msg.add_header(TRACIM_SPECIAL_KEY_HEADER, 'key')
    maildata=decode_mail(msg)
    # same format for date
    date_tuple = parsedate_tz('Wed, 8 Nov 2017 15:21:10 +0100')
    date = datetime.datetime.fromtimestamp(mktime_tz(date_tuple))

    assert maildata == {
        TRACIM_SPECIAL_KEY_HEADER: 'key',
        'from': 'a@home',
        'to': 'b@home',
        'subject':'test',
        'references':'reply+key@home',
        'msg_id': '<uniquevalue@home>',
        'date': date
    }
# get_tracim_content_key

def test_get_tracim_content_key_empty():
    mail_data={}
    assert get_tracim_content_key(mail_data) == None

def test_get_tracim_content_key_no_key():
    mail_data={
        'to':'a@b',
        'references':'<a@b> <b@c>'
    }
    assert get_tracim_content_key(mail_data) == None

def test_get_tracim_content_key_special_key():
    mail_data={
        'to':'a@b',
        'references':'<a@b> <b@c>',
        TRACIM_SPECIAL_KEY_HEADER : 'key'
    }
    assert get_tracim_content_key(mail_data) == 'key'


def test_get_tracim_content_key_to_key():
    mail_data={
        'to':'a+key@b',
        'references':'<a@b> <b@c>',
    }
    assert get_tracim_content_key(mail_data) == 'key'

def test_get_tracim_content_key_references_key():
    mail_data={
        'to':'a@b',
        'references':'<a+key@b> <b@c>',
    }
    assert get_tracim_content_key(mail_data) == 'key'

def test_get_tracim_content_key_order():
    mail_data={
        'to':'a+2@b',
        'references':'<a+3@b> <b@c>',
        TRACIM_SPECIAL_KEY_HEADER: '1'
    }
    assert get_tracim_content_key(mail_data) == '1'
    mail_data={
        'to':'a+2@b',
        'references':'<a+3@b> <b@c>',
    }
    assert get_tracim_content_key(mail_data) == '2'

    mail_data={
        'references':'<a+3@b> <b@c>',
    }
    assert get_tracim_content_key(mail_data) == '3'

# find_key_from_mail_address

def test_find_key_from_mail_address_no_key():
    mail_adress="a@b"
    assert find_key_from_mail_adress(mail_adress) == None

def test_find_key_from_mail_adress_key():
    mail_address="a+key@b"
    assert find_key_from_mail_adress(mail_address) == 'key'
