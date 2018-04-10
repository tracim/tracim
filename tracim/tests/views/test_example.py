# -*- coding: utf-8 -*-
# TODO - G.M - [Cleanup][tempExample] Drop this file
# import unittest
# import transaction
#
# from pyramid import testing
#
#
# def dummy_request(dbsession):
#     return testing.DummyRequest(dbsession=dbsession)
#
#
# class BaseTest(unittest.TestCase):
#     def setUp(self):
#         self.config = testing.setUp(settings={
#             'sqlalchemy.url': 'sqlite:///:memory:'
#         })
#         self.config.include('tracim.models')
#         settings = self.config.get_settings()
#
#         from tracim.models import (
#             get_engine,
#             get_session_factory,
#             get_tm_session,
#             )
#
#         self.engine = get_engine(settings)
#         session_factory = get_session_factory(self.engine)
#
#         self.session = get_tm_session(session_factory, transaction.manager)
#
#     def init_database(self):
#         from tracim.models.meta import DeclarativeBase
#         DeclarativeBase.metadata.create_all(self.engine)
#
#     def tearDown(self):
#         from tracim.models.meta import DeclarativeBase
#
#         testing.tearDown()
#         transaction.abort()
#         DeclarativeBase.metadata.drop_all(self.engine)
#
#
# class TestMyViewSuccessCondition(BaseTest):
#
#     def setUp(self):
#         super(TestMyViewSuccessCondition, self).setUp()
#         self.init_database()
#
#         from tracim.models import MyModel
#
#         model = MyModel(name='one', value=55)
#         self.session.add(model)
#
#     def test_passing_view(self):
#         from tracim.views.default import my_view
#         info = my_view(dummy_request(self.session))
#         self.assertEqual(info['one'].name, 'one')
#         self.assertEqual(info['project'], 'tracim')
#
#
# class TestMyViewFailureCondition(BaseTest):
#
#     def test_failing_view(self):
#         from tracim.views.default import my_view
#         info = my_view(dummy_request(self.session))
#         self.assertEqual(info.status_int, 500)
