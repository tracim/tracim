# -*- encoding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 9
_modified_time = 1378373679.629635
_enable_loop = True
_template_filename = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/environ.mak'
_template_uri = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/environ.mak'
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
        environment = context.get('environment', UNDEFINED)
        sorted = context.get('sorted', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 1
        __M_writer(u'\n\n')
        # SOURCE LINE 5
        __M_writer(u'\n\n<h2>The WSGI nature of the framework</h2>\n  <p>In this page you can see all the WSGI variables your request object has, \n     the ones in capital letters are required by the spec, then a sorted by\n     component list of variables provided by the Components, and at last\n     the "wsgi." namespace with very useful information about your WSGI Server</p>\n  <p>The keys in the environment are: \n  <table class="table">\n')
        # SOURCE LINE 14
        for key in sorted(environment):
            # SOURCE LINE 15
            __M_writer(u'      <tr>\n          <td>')
            # SOURCE LINE 16
            __M_writer(escape(key))
            __M_writer(u'</td>\n          <td>')
            # SOURCE LINE 17
            __M_writer(escape(environment[key]))
            __M_writer(u'</td>\n      </tr>\n')
        # SOURCE LINE 20
        __M_writer(u'  </table>\n\n  </p>\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        # SOURCE LINE 3
        __M_writer(u'\n  Learning TurboGears 2.3: Information about TG and WSGI\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


