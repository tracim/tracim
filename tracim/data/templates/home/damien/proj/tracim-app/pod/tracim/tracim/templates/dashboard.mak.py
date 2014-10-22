# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984376.263731
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/dashboard.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/dashboard.mak'
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
    ns = runtime.TemplateNamespace('TIM', context._clean_inheritance_tokens(), templateuri='tracim.templates.pod', callables=None,  calling_uri=_template_uri)
    context.namespaces[(__name__, 'TIM')] = ns

def _mako_inherit(template, context):
    _mako_generate_namespaces(context)
    return runtime._inherit_from(context, 'local:templates.master_authenticated', _template_uri)
def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        TIM = _mako_get_namespace(context, 'TIM')
        _ = context.get('_', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n')
        __M_writer('\n\n')
        __M_writer('\n\n<div class="container-fluid">\n    <div class="row-fluid">\n        <div>\n            <div class="row">\n                <h1 class="col-sm-6 col-sm-offset-3 text-center">')
        __M_writer(escape(TIM.ICO(32, 'status/dialog-information')))
        __M_writer(' ')
        __M_writer(escape(_("Welcome to your dashboard")))
        __M_writer('</h1>\n            </div>\n            <div class="row">\n                <div class="col-sm-5 col-sm-offset-4">\n                    <div class="well">\n                        <h2 style="margin-top: 0;">')
        __M_writer(escape(_('What to do ?')))
        __M_writer('</h2>\n                        <h3>\n                            ')
        __M_writer(escape(TIM.ICO(32, 'places/folder-remote')))
        __M_writer(' <a href="')
        __M_writer(escape(tg.url('/workspaces')))
        __M_writer('">')
        __M_writer(escape(_('Go to my workspaces')))
        __M_writer('</a>\n                        </h3>\n                        <h3>\n                            ')
        __M_writer(escape(TIM.ICO(32, 'actions/contact-new')))
        __M_writer(' <a href="')
        __M_writer(escape(tg.url('/user/me')))
        __M_writer('">')
        __M_writer(escape(_('Go to my profile')))
        __M_writer('</a>\n                        </h3>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    ')
        __M_writer(escape(_('Dashboard')))
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"23": 2, "29": 0, "37": 1, "38": 2, "39": 6, "40": 12, "41": 12, "42": 12, "43": 12, "44": 17, "45": 17, "46": 19, "47": 19, "48": 19, "49": 19, "50": 19, "51": 19, "52": 22, "53": 22, "54": 22, "55": 22, "56": 22, "57": 22, "63": 4, "68": 4, "69": 5, "70": 5, "76": 70}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/dashboard.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/dashboard.mak"}
__M_END_METADATA
"""
