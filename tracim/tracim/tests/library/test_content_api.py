# -*- coding: utf-8 -*-

from nose.tools import eq_

import transaction

from tracim.lib.content import compare_content_for_sorting_by_type_and_name
from tracim.lib.content import ContentApi

from tracim.model.data import Content
from tracim.model.data import ContentType

from tracim.tests import TestStandard


class TestContentApi(TestStandard):

    def test_compare_content_for_sorting_by_type(self):
        c1 = Content()
        c1.label = ''
        c1.type = 'file'

        c2 = Content()
        c2.label = ''
        c2.type = 'folder'

        c11 = c1

        eq_(1, compare_content_for_sorting_by_type_and_name(c1, c2))
        eq_(-1, compare_content_for_sorting_by_type_and_name(c2, c1))
        eq_(0, compare_content_for_sorting_by_type_and_name(c1, c11))

    def test_compare_content_for_sorting_by_label(self):
        c1 = Content()
        c1.label = 'bbb'
        c1.type = 'file'

        c2 = Content()
        c2.label = 'aaa'
        c2.type = 'file'

        c11 = c1

        eq_(1, compare_content_for_sorting_by_type_and_name(c1, c2))
        eq_(-1, compare_content_for_sorting_by_type_and_name(c2, c1))
        eq_(0, compare_content_for_sorting_by_type_and_name(c1, c11))

    def test_sort_by_label_or_filename(self):
        c1 = Content()
        c1.label = 'ABCD'
        c1.type = 'file'

        c2 = Content()
        c2.label = ''
        c2.type = 'file'
        c2.file_name = 'AABC'

        c3 = Content()
        c3.label = 'BCDE'
        c3.type = 'file'

        items = [c1, c2, c3]
        sorteds = ContentApi.sort_content(items)

        eq_(sorteds[0], c2)
        eq_(sorteds[1], c1)
        eq_(sorteds[2], c3)

    def test_sort_by_content_type(self):
        c1 = Content()
        c1.label = 'AAAA'
        c1.type = 'file'

        c2 = Content()
        c2.label = 'BBBB'
        c2.type = 'folder'

        items = [c1, c2]
        sorteds = ContentApi.sort_content(items)

        eq_(sorteds[0], c2, 'value is {} instead of {}'.format(sorteds[0].content_id, c2.content_id))
        eq_(sorteds[1], c1, 'value is {} instead of {}'.format(sorteds[1].content_id, c1.content_id))

class TestContentApiFilteringDeletedItem(TestStandard):

    def test_delete(self):
        api = ContentApi(None)
        item = api.create(ContentType.Folder, None, None, 'not_deleted', True)
        item2 = api.create(ContentType.Folder, None, None, 'to_delete', True)
        transaction.commit()

        items = api.get_all(None, ContentType.Any, None)
        eq_(2, len(items))

        items = api.get_all(None, ContentType.Any, None)
        api.delete(items[0])
        transaction.commit()

        items = api.get_all(None, ContentType.Any, None)
        eq_(1, len(items))
        transaction.commit()

        # Test that the item is still available if "show deleted" is activated
        api = ContentApi(None, show_deleted=True)
        items = api.get_all(None, ContentType.Any, None)
        eq_(2, len(items))


    def test_archive(self):
        api = ContentApi(None)
        item = api.create(ContentType.Folder, None, None, 'not_archived', True)
        item2 = api.create(ContentType.Folder, None, None, 'to_archive', True)
        transaction.commit()

        items = api.get_all(None, ContentType.Any, None)
        eq_(2, len(items))

        items = api.get_all(None, ContentType.Any, None)
        api.archive(items[0])
        transaction.commit()

        items = api.get_all(None, ContentType.Any, None)
        eq_(1, len(items))
        transaction.commit()

        # Test that the item is still available if "show deleted" is activated
        api = ContentApi(None, show_archived=True)
        items = api.get_all(None, ContentType.Any, None)
        eq_(2, len(items))
