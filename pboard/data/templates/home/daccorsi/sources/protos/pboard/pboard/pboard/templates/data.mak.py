# -*- encoding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 9
_modified_time = 1378373693.265038
_enable_loop = True
_template_filename = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/data.mak'
_template_uri = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/data.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['title']


def _mako_get_namespace(context, name):
    try:
        return context.namespaces[(__name__, name)]
    except KeyError:
        _mako_generate_namespaces(context)
        return context.namespaces[(__name__, name)]
def _mako_generate_namespaces(context):
    pass
def _mako_inherit(template, context):
    _mako_generate_namespaces(context)
    return runtime._inherit_from(context, u'local:templates.master', _template_uri)
def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        tg = context.get('tg', UNDEFINED)
        params = context.get('params', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 1
        __M_writer(u'\n\n')
        # SOURCE LINE 5
        __M_writer(u'\n\n<h2>Content Type Dispatch</h2>\n<p>\nThis page shows how you can provide multiple pages\ndirectly from the same controller method.  This page is generated \nfrom the expose decorator with the template defintion provided.\nYou can provide a url with parameters and this page will display\nthe parameters as html, and the json version will express\nthe entries as JSON.  Here, try it out: <a href="/data.html?a=1&b=2">/data.html?a=1&b=2</a>\n</p>\n\n<p>Click here for the <a href="')
        # SOURCE LINE 17
        __M_writer(escape(tg.url('/data.json', params=params)))
        __M_writer(u'">JSON Version of this page.</a></p>\n<p>The data provided in the template call is: \n    <table>\n')
        # SOURCE LINE 20
        for key, value in params.items():
            # SOURCE LINE 21
            __M_writer(u'            <tr>\n                <td>')
            # SOURCE LINE 22
            __M_writer(escape(key))
            __M_writer(u'</td>\n                <td>')
            # SOURCE LINE 23
            __M_writer(escape(value))
            __M_writer(u'</td>\n            </tr>\n')
        # SOURCE LINE 26
        __M_writer(u'    </table>\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        # SOURCE LINE 3
        __M_writer(u'\n  Welcome to TurboGears 2.3, standing on the shoulders of giants, since 2007\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


