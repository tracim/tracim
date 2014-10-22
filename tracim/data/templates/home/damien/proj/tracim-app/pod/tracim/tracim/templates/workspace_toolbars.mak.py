# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984378.109744
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/workspace_toolbars.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/workspace_toolbars.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['WORKSPACES', 'WORKSPACE']


def _mako_get_namespace(context, name):
    try:
        return context.namespaces[(__name__, name)]
    except KeyError:
        _mako_generate_namespaces(context)
        return context.namespaces[(__name__, name)]
def _mako_generate_namespaces(context):
    ns = runtime.TemplateNamespace('TIM', context._clean_inheritance_tokens(), templateuri='tracim.templates.pod', callables=None,  calling_uri=_template_uri)
    context.namespaces[(__name__, 'TIM')] = ns

def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        __M_writer = context.writer()
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_WORKSPACES(context,user):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        __M_writer('\n')
        __M_writer('    <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar" style="background-color: #FFF;">\n        <div class="btn-group btn-group-vertical">\n        </div>\n        <p></p>\n    </div> <!-- # End of side bar right -->\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_WORKSPACE(context,workspace,user):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        result = context.get('result', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n')
        __M_writer('    <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar" style="background-color: #FFF;">\n        <div class="btn-group btn-group-vertical">\n            <a title="')
        __M_writer(escape(_('Edit current workspace')))
        __M_writer('" class="btn btn-default" data-toggle="modal" data-target="#workspace-edit-modal-dialog" data-remote="')
        __M_writer(escape(tg.url('/admin/workspaces/{}/edit'.format(workspace.id))))
        __M_writer('" >')
        __M_writer(escape(TIM.ICO(32, 'apps/accessories-text-editor')))
        __M_writer('</a>\n        </div>\n        <p></p>\n')
        if user.profile.id>=2:
            __M_writer('        <div class="btn-group btn-group-vertical">\n            <a title="')
            __M_writer(escape(_('Delete current workspace')))
            __M_writer('" class="btn btn-default" href="')
            __M_writer(escape(tg.url('/admin/workspaces/{}/delete'.format(result.workspace.id))))
            __M_writer('">')
            __M_writer(escape(TIM.ICO(32, 'status/user-trash-full')))
            __M_writer('</a>\n        </div>\n')
        __M_writer('    </div> <!-- # End of side bar right -->\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"23": 1, "26": 0, "31": 1, "32": 21, "33": 31, "39": 23, "43": 23, "44": 25, "50": 3, "58": 3, "59": 5, "60": 7, "61": 7, "62": 7, "63": 7, "64": 7, "65": 7, "66": 12, "67": 15, "68": 16, "69": 16, "70": 16, "71": 16, "72": 16, "73": 16, "74": 19, "80": 74}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/workspace_toolbars.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/workspace_toolbars.mak"}
__M_END_METADATA
"""
