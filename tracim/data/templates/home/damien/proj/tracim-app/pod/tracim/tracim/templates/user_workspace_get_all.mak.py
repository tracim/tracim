# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984378.092287
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_get_all.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_get_all.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['REQUIRED_DIALOGS', 'SIDEBAR_RIGHT_CONTENT', 'SIDEBAR_LEFT_CONTENT', 'title']


def _mako_get_namespace(context, name):
    try:
        return context.namespaces[(__name__, name)]
    except KeyError:
        _mako_generate_namespaces(context)
        return context.namespaces[(__name__, name)]
def _mako_generate_namespaces(context):
    ns = runtime.TemplateNamespace('FORMS', context._clean_inheritance_tokens(), templateuri='tracim.templates.user_workspace_forms', callables=None,  calling_uri=_template_uri)
    context.namespaces[(__name__, 'FORMS')] = ns

    ns = runtime.TemplateNamespace('TIM', context._clean_inheritance_tokens(), templateuri='tracim.templates.pod', callables=None,  calling_uri=_template_uri)
    context.namespaces[(__name__, 'TIM')] = ns

    ns = runtime.TemplateNamespace('WIDGETS', context._clean_inheritance_tokens(), templateuri='tracim.templates.user_workspace_widgets', callables=None,  calling_uri=_template_uri)
    context.namespaces[(__name__, 'WIDGETS')] = ns

    ns = runtime.TemplateNamespace('TOOLBAR', context._clean_inheritance_tokens(), templateuri='tracim.templates.workspace_toolbars', callables=None,  calling_uri=_template_uri)
    context.namespaces[(__name__, 'TOOLBAR')] = ns

def _mako_inherit(template, context):
    _mako_generate_namespaces(context)
    return runtime._inherit_from(context, 'local:templates.master_authenticated_left_treeview_right_toolbar', _template_uri)
def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        TIM = _mako_get_namespace(context, 'TIM')
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n\n')
        __M_writer('\n')
        __M_writer('\n')
        __M_writer('\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n<h1 class="page-header">')
        __M_writer(escape(TIM.ICO(32, 'places/folder-remote')))
        __M_writer(' ')
        __M_writer(escape(_('My workspaces')))
        __M_writer('</h1>\n\n<div class="row">\n    <div id=\'application-document-panel\' class="col-sm-12">\n        <div id=\'current-document-content\' class="well col-sm-7">\n          <h4>\n            ')
        __M_writer(escape(TIM.ICO(32, 'status/dialog-information')))
        __M_writer('\n            ')
        __M_writer(escape(_('Let\'s start working on existing information.')))
        __M_writer('<br/>\n            <i class="fa fa-angle-double-left fa-3x fa-fw pod-blue" style="vertical-align: middle"></i>\n          </h4>\n        </div>\n    </div>\n</div>\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_REQUIRED_DIALOGS(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_SIDEBAR_RIGHT_CONTENT(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_SIDEBAR_LEFT_CONTENT(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        WIDGETS = _mako_get_namespace(context, 'WIDGETS')
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <h4>')
        __M_writer(escape(_('Workspaces')))
        __M_writer('</h4>\n    ')
        __M_writer(escape(WIDGETS.TREEVIEW('sidebar-left-menu', '__')))
        __M_writer('\n    <hr/>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer(escape(_('My workspaces')))
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"23": 5, "26": 3, "29": 6, "32": 4, "38": 0, "45": 1, "46": 3, "47": 4, "48": 5, "49": 6, "50": 8, "51": 14, "52": 18, "53": 21, "54": 28, "55": 29, "56": 29, "57": 29, "58": 29, "59": 35, "60": 35, "61": 36, "62": 36, "68": 20, "72": 20, "78": 16, "82": 16, "88": 10, "94": 10, "95": 11, "96": 11, "97": 12, "98": 12, "104": 8, "109": 8, "115": 109}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_get_all.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_get_all.mak"}
__M_END_METADATA
"""
