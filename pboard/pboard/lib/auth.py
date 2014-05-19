# -*- coding: utf-8 -*-
"""Predicates for authorizations"""
from tg.predicates import Predicate
from pboard.model import DBSession as session
from pboard.model.auth import Permission, User

class can_read(Predicate):
    message = ""

    def __init__(self, **kwargs):
        pass

    def evaluate(self, environ, credentials):
        if 'node' in environ['webob.adhoc_attrs']['validation']['values']:
            node_id = environ['webob.adhoc_attrs']['validation']['values']['node']
            if node_id!=0:
                has_right = session.execute("""
                        select *
                        from pod_group_node pgn
                        join pod_user_group pug on pug.group_id = pgn.group_id
                        join pod_user pu on pug.user_id = pu.user_id
                        where rights > 0
                        and email_address = :mail
                        and node_id = :node""", {"mail":credentials["repoze.who.userid"], "node":node_id})
                if has_right.rowcount == 0 :
                    self.unmet()
