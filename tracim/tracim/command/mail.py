# -*- coding: utf-8 -*-
from rq import Connection, Worker

from tracim.command import AppContextCommand


class MailSenderCommend(AppContextCommand):
    def get_description(self):
        return '''Run rq worker for mail sending'''

    def take_action(self, parsed_args):
        super().take_action(parsed_args)

        with Connection():
            w = Worker(['mail_sender'])
            w.work()
