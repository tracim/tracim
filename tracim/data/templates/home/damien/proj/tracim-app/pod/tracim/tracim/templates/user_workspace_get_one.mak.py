# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984379.696722
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_get_one.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_get_one.mak'
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
        h = context.get('h', UNDEFINED)
        len = context.get('len', UNDEFINED)
        FORMS = _mako_get_namespace(context, 'FORMS')
        TIM = _mako_get_namespace(context, 'TIM')
        result = context.get('result', UNDEFINED)
        WIDGETS = _mako_get_namespace(context, 'WIDGETS')
        fake_api = context.get('fake_api', UNDEFINED)
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
        __M_writer(escape(result.workspace.label))
        __M_writer('</h1>\n<div style="margin: -1.5em auto 1em auto;">\n  <p>')
        __M_writer(_('created on {}').format(h.date_time_in_long_format(result.workspace.created)))
        __M_writer('</p>\n</div>\n<p>\n    ')
        __M_writer(escape(result.workspace.description))
        __M_writer('\n</p>\n<p>\n    ')
        member_nb = len(result.workspace.members) 
        
        __M_locals_builtin_stored = __M_locals_builtin()
        __M_locals.update(__M_dict_builtin([(__M_key, __M_locals_builtin_stored[__M_key]) for __M_key in ['member_nb'] if __M_key in __M_locals_builtin_stored]))
        __M_writer('\n')
        if member_nb<=0:
            __M_writer('        ')
            __M_writer(escape(WIDGETS.EMPTY_CONTENT(_('There are no members in this workspace'))))
            __M_writer('\n')
        else:
            __M_writer('        ')
            __M_writer(escape(TIM.ICO(16, 'apps/system-users')))
            __M_writer(' &mdash;\n')
            for member in result.workspace.members:
                __M_writer('            <strong>')
                __M_writer(escape(member.name))
                __M_writer('</strong>\n            ')
                __M_writer(escape(TIM.ICO_FA_BADGED('fa fa-flag', member.role_description, member.style)))
                __M_writer('&emsp;\n')
        __M_writer('</p>\n<hr class="pod-panel-separator"/>\n\n\n')
        if h.user_role(fake_api.current_user, result.workspace)<=2: # User must be a content manager to be allowed to create folders
            __M_writer('    ')
            __M_writer(escape(WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.workspace, 'sub-folders', _('Folders'))))
            __M_writer('\n')
        else:
            __M_writer('    ')
            __M_writer(escape(WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.workspace, 'sub-folders', _('Folders'), 'folder-new', _('Add a folder...'))))
            __M_writer('\n    ')
            __M_writer(escape(FORMS.NEW_FOLDER_FORM('folder-new', result.workspace.id)))
            __M_writer('\n')
        __M_writer('\n\n<p>\n    ')
        __M_writer(escape(WIDGETS.FOLDER_LIST('subfolder-list', result.workspace.id, fake_api.current_workspace_folders)))
        __M_writer('\n</p>\n\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_REQUIRED_DIALOGS(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        __M_writer = context.writer()
        __M_writer('\n    ')
        __M_writer(escape(TIM.HELP_MODAL_DIALOG('content-wiki-page-definition')))
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
        result = context.get('result', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <h4>')
        __M_writer(escape(_('Workspaces')))
        __M_writer('</h4>\n    ')
        __M_writer(escape(WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__'.format(result.workspace.id))))
        __M_writer('\n    <hr/>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        result = context.get('result', UNDEFINED)
        __M_writer = context.writer()
        __M_writer(escape(result.workspace.label))
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"130": 10, "137": 10, "138": 11, "139": 11, "140": 12, "141": 12, "147": 8, "23": 5, "152": 8, "26": 3, "29": 6, "158": 152, "32": 4, "38": 0, "51": 1, "52": 3, "53": 4, "54": 5, "55": 6, "56": 8, "57": 14, "58": 18, "59": 22, "60": 29, "61": 30, "62": 30, "63": 30, "64": 30, "65": 32, "66": 32, "67": 35, "68": 35, "69": 38, "73": 38, "74": 39, "75": 40, "76": 40, "77": 40, "78": 41, "79": 42, "80": 42, "81": 42, "82": 43, "83": 44, "84": 44, "85": 44, "86": 45, "87": 45, "88": 48, "89": 52, "90": 53, "91": 53, "92": 53, "93": 54, "94": 55, "95": 55, "96": 55, "97": 56, "98": 56, "99": 58, "100": 61, "101": 61, "107": 20, "112": 20, "113": 21, "114": 21, "120": 16, "124": 16}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_get_one.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_get_one.mak"}
__M_END_METADATA
"""
