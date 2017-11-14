from email.message import Message
from typing import Union
import sys
import time
import imaplib
import email
import email.header
from email.header import Header, decode_header, make_header
import requests
import datetime
from tracim.controllers.events import VALID_TOKEN_VALUE
import json

TRACIM_SPECIAL_KEY_HEADER="X-Tracim-Key"

def str_header(header:Header):
    return str(make_header(decode_header(header)))

def decode_mail(msg:Message)-> dict:
    """
    Get useful header and body content and decode from Message
    :param msg:
    :return:
    """
    mailData = {}

    try:
        mailData['subject'] = str_header(msg['subject'])
        mailData['msg_id'] = str_header(msg['Message-ID'])
        mailData['from'] = str_header(msg['From'])
        # Reply key
        mailData['to'] = str_header(msg['To'])
        mailData['references'] = str_header(msg['References'])
        if TRACIM_SPECIAL_KEY_HEADER in msg:
            mailData[TRACIM_SPECIAL_KEY_HEADER] = str_header(msg[TRACIM_SPECIAL_KEY_HEADER])
        # date
        date_h = str_header(msg['Date'])
        date_tuple = email.utils.parsedate_tz(date_h)

        mailData['date'] = datetime.datetime.fromtimestamp(email.utils.mktime_tz(date_tuple))

    except Exception as e:
        # TODO: exception -> mail not correctly formatted
        return None
    #email.utils.mktime_tz(date_tuple))
    #print( "Local Date:", local_date.strftime("%a, %d %b %Y %H:%M:%S"))
    ## TODO : msg.get_body look like the best way to get body but it's a new feature now (08112017).
    for part in msg.walk():
        if not part.get_content_type() == "text/plain":
            continue
        else:
            # TODO: check if decoding is working correctly
            charset = part.get_content_charset('iso-8859-1')
            mailData['body']= part.get_payload(decode=True).decode(charset)
            break
    return mailData

def get_tracim_content_key(mailData:dict) -> Union[str,None]:

    """ Link mailData dict to tracim content
    First try checking special header, them check 'to' header
    and finally check first(oldest) mail-id of 'references' header
    """
    key = None
    if TRACIM_SPECIAL_KEY_HEADER in mailData:
        key = mailData[TRACIM_SPECIAL_KEY_HEADER]
    if key is None and 'to' in mailData:
        key = find_key_from_mail_adress(mailData['to'])
    if key is None and 'references' in mailData:
        mail_adress = mailData['references'].split('>')[0].replace('<', '')
        key = find_key_from_mail_adress(mail_adress)
    return key

def get_email_address_from_header(header:str) -> str:
    return header.split('<')[1].split('>')[0]

def find_key_from_mail_adress(mail_address:str) -> Union[str,None]:
    """ Parse mail_adress-like string
    to retrieve key.

    :param mail_address: user+key@something like string
    :return: key
    """
    username= mail_address.split('@')[0]
    username_data = username.split('+')
    if len(username_data) == 2:
        key = username_data[1]
    else:
        key = None
    return key


class MailFetcher(object):

    def __init__(self,host,port,user,password,folder,delay):
        self._connection = None
        self._mails = []

        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.folder = folder
        self.delay = delay

        self._is_active = True


    def run(self):
        while self._is_active:
            time.sleep(self.delay)
            self._connect()
            self._fetch()
            self._notify_tracim()
            self._disconnect()

    def stop(self):
        self._is_active = False

    def _connect(self):
        ## verify if connected ?
        if self._connection:
            self._disconnect()
        # TODO: Support unencrypted connection ?
        # TODO: Support keyfile,certfile ?
        self._connection = imaplib.IMAP4_SSL(self.host,self.port)
        try:
            rv, data = self._connection.login(self.user,self.password)
        except Exception as e:
            log = 'IMAP login error: {}'
            logger.debug(self, log.format(e.__str__()))

    def _disconnect(self):
        if self._connection:
            self._connection.close()
            self._connection.logout()
            self._connection = None

    def _fetch(self):
        """
        Get news message from mailbox
        """

        # select mailbox
        rv, data = self._connection.select(self.folder)
        if rv == 'OK':
            # get mails
            # TODO: search only new mail or drop/moved the added one ?
            rv, data = self._connection.search(None, "(UNSEEN)")
            if rv == 'OK':
                # get mail content
                for num in data[0].split():
                    rv, data = self._connection.fetch(num, '(RFC822)')
                    if rv == 'OK':
                        msg = email.message_from_bytes(data[0][1])
                        self._mails.append(msg)
                        ret = True
                    else:
                        # TODO : Check best debug value
                        log = 'IMAP : Unable to get mail : {}'
                        logger.debug(self,log.format(str(rv)))
            else:
                #TODO : Distinct error from empty mailbox ?
                pass
        else :
            # TODO : Check best debug value
            log = 'IMAP : Unable to open mailbox : {}'
            logger.debug(self,log.format(str(rv)))

    def _notify_tracim(self):
        while self._mails:
            mail = self._mails.pop()
            decoded_mail = decode_mail(mail)
            msg = {"token" : VALID_TOKEN_VALUE,
                   "user_mail" : get_email_address_from_header(decoded_mail['from']),
                   "content_id" : get_tracim_content_key(decoded_mail),
                   "payload": {
                       "content": decoded_mail['body']
                   }}

            requests.post('http://localhost:8080/events',json=msg)
            pass
