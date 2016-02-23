# -*- coding: utf-8 -*-

from datetime import datetime
from nose.tools import eq_
from nose.tools import ok_
from nose.tools import raises

import tg

from tracim.model import DBSession

from tg.util import LazyString
from tracim.model.data import Content
from tracim.model.data import ContentType
from tracim.model.data import Workspace

from tracim.model.serializers import Context
from tracim.model.serializers import ContextConverterNotFoundException
from tracim.model.serializers import CTX
from tracim.model.serializers import DictLikeClass
from tracim.model.serializers import pod_serializer

from tracim.model.data import ActionDescription

from tracim.tests import TestStandard



class TestSerializers(TestStandard):

    def test_DictLikeClass(self):
        instance = DictLikeClass()

        instance.bob = 'titi'
        ok_(instance.bob==instance['bob'])

        instance['titi'] = 'bob'
        ok_(instance.titi==instance['titi'])

        instance2 = DictLikeClass(instance)
        ok_(instance2.bob==instance2['bob'])
        ok_(instance2.bob==instance.bob)
        ok_(instance2.titi==instance2['titi'])
        ok_(instance2.titi==instance.titi)

        instance3 = DictLikeClass({'bob': 'titi', 'toto': 'bib'})
        ok_(instance3.bob=='titi')
        ok_(instance3.bob==instance3['bob'])

        ok_(instance3.toto=='bib')
        ok_(instance3.toto==instance3['toto'])

    def test_ContextConverterNotFoundException(self):
        class DummyClass(object):
            pass
        context = 'some_context'
        e = ContextConverterNotFoundException(context, DummyClass)
        eq_('converter not found (context: some_context - model: DummyClass)', e.__str__())

    def test_serialize_ActionDescription_DEFAULT(self):
        obj = ActionDescription('archiving')
        obj.icon = 'places/folder-remote'
        obj.label = 'edit the content'

        res = Context(CTX.DEFAULT).toDict(obj)
        eq_(res.__class__, DictLikeClass)
        eq_(obj.id, res.id)
        eq_(obj.label, res.label)
        eq_(obj.icon, res.icon)
        eq_(3, len(res.keys()))

    def test_serialize_Content_DEFAULT(self):
        self.app.get('/_test_vars')  # Allow to create fake context

        obj = Content()
        obj.content_id = 132
        obj.label = 'Some label'
        obj.description = 'Some Description'

        res = Context(CTX.DEFAULT).toDict(obj)
        eq_(res.__class__, DictLikeClass, res)
        eq_(obj.content_id, res.id, res)
        eq_(obj.label, res.label, res)

        ok_('folder' in res.keys())
        ok_('id' in res.folder.keys())
        eq_(None, res.folder.id)
        eq_(1, len(res.folder.keys()))

        ok_('workspace' in res.keys())
        eq_(None, res.workspace, res)
        eq_(4, len(res.keys()), res)

    def test_serialize_Content_comment_THREAD(self):
        wor = Workspace()
        wor.workspace_id = 4

        fol = Content()
        fol.type = ContentType.Folder
        fol.content_id = 72
        fol.workspace = wor

        par = Content()
        par.type = ContentType.Thread
        par.content_id = 37
        par.parent = fol
        par.workspace = wor
        par.created = datetime.now()

        obj = Content()
        obj.type = ContentType.Comment
        obj.content_id = 132
        obj.label = 'some label'
        obj.description = 'Some Description'
        obj.parent = par
        obj.created = datetime.now()

        print('LANGUAGES #2 ARE', tg.i18n.get_lang())
        res = Context(CTX.THREAD).toDict(obj)
        eq_(res.__class__, DictLikeClass, res)

        ok_('label' in res.keys())
        eq_(obj.label, res.label, res)

        ok_('content' in res.keys())
        eq_(obj.description, res.content, res)

        ok_('created' in res.keys())

        ok_('icon' in res.keys())
        eq_(ContentType.get_icon(obj.type), res.icon, res)

        ok_('delete' in res.urls.keys())

        eq_(10, len(res.keys()), len(res.keys()))

    def test_serializer_get_converter_return_CTX_DEFAULT(self):
        class A(object):
            pass

        @pod_serializer(A, CTX.DEFAULT)
        def dummy_converter(item: A, context: Context):
            return DictLikeClass({'a': 'agaga'})

        converter = Context.get_converter(CTX.FILE, A)
        eq_(converter, dummy_converter)

    @raises(ContextConverterNotFoundException)
    def test_serializer_get_converter_raise_ContextConverterNotFoundException(self):
        class A(object):
            pass

        @pod_serializer(A, CTX.PAGE)
        def dummy_converter(item: A, context: Context):
            return DictLikeClass({'a': 'agaga'})

        converter = Context.get_converter(CTX.FILE, A)



    def test_serializer_toDict_int_str_and_LazyString(self):
        s = Context(CTX.DEFAULT).toDict(5)
        ok_(isinstance(s, int))
        eq_(5, s)

        s2 = Context(CTX.DEFAULT).toDict('bob')
        ok_(isinstance(s2, str))
        eq_('bob', s2)

        lazystr = LazyString('bob')
        s3 = Context(CTX.DEFAULT).toDict(lazystr)
        ok_(isinstance(s3, LazyString))
        eq_(lazystr, s3)

    def test_serializer_toDict_for_list_of_objects(self):
        class A(object):
            def __init__(self, name):
                self.name = name

        @pod_serializer(A, CTX.DEFAULT)
        def dummy_converter(item: A, context: Context):
            return DictLikeClass({'name': item.name})

        mylist = [
            A('a'), A('b'), A('C')
        ]

        s = Context(CTX.DEFAULT).toDict(mylist)
        ok_('name' in s[0].keys())
        eq_('a', s[0].name)
        ok_('name' in s[1].keys())
        eq_('b', s[1].name)
        ok_('name' in s[2].keys())
        eq_('C', s[2].name)
        eq_(3, len(s))

        s2 = Context(CTX.DEFAULT).toDict(mylist, 'subitems', 'subitems_nb')

        ok_('subitems' in s2.keys(), s2)

        ok_('name' in s2.subitems[0].keys())
        eq_('a', s2.subitems[0].name)
        ok_('name' in s2.subitems[1].keys())
        eq_('b', s2.subitems[1].name)
        ok_('name' in s2.subitems[2].keys())
        eq_('C', s2.subitems[2].name)

        ok_('subitems' in s2.keys())
        ok_('subitems_nb' in s2.keys())
        eq_(3, s2.subitems_nb)
        eq_(3, len(s2.subitems))

        eq_(2, len(s2))


    def test_serializer_content__menui_api_context__children(self):
        folder_without_child = Content()
        folder_without_child.type = ContentType.Folder
        folder_without_child.label = 'folder_without_child'
        res = Context(CTX.MENU_API).toDict(folder_without_child)
        eq_(False, res['children'])

        folder_with_child = Content()
        folder_with_child.type = ContentType.Folder
        folder_with_child.label = 'folder_with_child'
        folder_without_child.parent = folder_with_child
        DBSession.add(folder_with_child)
        DBSession.add(folder_without_child)
        DBSession.flush()

        res = Context(CTX.MENU_API).toDict(folder_with_child)
        eq_(True, res['children'])

        for curtype in ContentType.all():
            if curtype not in (ContentType.Folder, ContentType.Comment):
                item = Content()
                item.type = curtype
                item.label = 'item'

                fake_child = Content()
                fake_child.type = curtype
                fake_child.label = 'fake_child'
                fake_child.parent = item

                DBSession.add(item)
                DBSession.add(fake_child)
                DBSession.flush()

                res = Context(CTX.MENU_API).toDict(item)
                eq_(False, res['children'])
