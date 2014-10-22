# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984363.898257
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_folder_get_one.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_folder_get_one.mak'
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

    ns = runtime.TemplateNamespace('TOOLBAR', context._clean_inheritance_tokens(), templateuri='tracim.templates.folder_toolbars', callables=None,  calling_uri=_template_uri)
    context.namespaces[(__name__, 'TOOLBAR')] = ns

def _mako_inherit(template, context):
    _mako_generate_namespaces(context)
    return runtime._inherit_from(context, 'local:templates.master_authenticated_left_treeview_right_toolbar', _template_uri)
def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        FORMS = _mako_get_namespace(context, 'FORMS')
        TIM = _mako_get_namespace(context, 'TIM')
        result = context.get('result', UNDEFINED)
        WIDGETS = _mako_get_namespace(context, 'WIDGETS')
        h = context.get('h', UNDEFINED)
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
        __M_writer('\n<h1 class="page-header">\n    ')
        __M_writer(escape(TIM.ICO(32, 'places/jstree-folder')))
        __M_writer(' ')
        __M_writer(escape(result.folder.label))
        __M_writer('\n\n    <button id="current-page-breadcrumb-toggle-button" class="btn btn-link" title="')
        __M_writer(escape(_('Show localisation')))
        __M_writer('"><i class="fa fa-map-marker"></i></button>\n</h1>\n')
        __M_writer(escape(WIDGETS.BREADCRUMB('current-page-breadcrumb', fake_api.breadcrumb)))
        __M_writer('\n\n<div style="margin: -1.5em auto 1em auto;">\n  <p>')
        __M_writer(_('created on {} by <b>{}</b>').format(h.date_time_in_long_format(result.folder.created), result.folder.owner.name))
        __M_writer('</p>\n</div>\n<p>   \n    <b>')
        __M_writer(escape(_('Content:')))
        __M_writer('</b>\n')
        if result.folder.allowed_content.folder:
            __M_writer('        ')
            __M_writer(escape(TIM.ICO_BADGED(16, 'places/jstree-folder', _('sub-folders'))))
            __M_writer('\n')
        if result.folder.allowed_content.thread:
            __M_writer('        ')
            __M_writer(escape(TIM.ICO_BADGED(16, 'apps/internet-group-chat', _('threads'))))
            __M_writer('\n')
        if result.folder.allowed_content.file:
            __M_writer('        ')
            __M_writer(escape(TIM.ICO_BADGED(16, 'mimetypes/text-x-generic-template', _('files'))))
            __M_writer('\n')
        if result.folder.allowed_content.page:
            __M_writer('        ')
            __M_writer(escape(TIM.ICO_BADGED(16, 'mimetypes/text-html', _('pages'))))
            __M_writer('\n')
        __M_writer('</p>\n<hr class="pod-panel-separator"/>\n\n')
        if result.folder.allowed_content.folder:
            if h.user_role(fake_api.current_user, result.folder.workspace)<=2: # User must be a content manager to be allowed to create folders
                __M_writer('        ')
                __M_writer(escape(WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.folder.workspace, 'sub-folders', _('Sub-folders'))))
                __M_writer('\n')
            else:
                __M_writer('        ')
                __M_writer(escape(WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.folder.workspace, 'sub-folders', _('Sub-folders'), 'folder-new', _('create new folder...'))))
                __M_writer('\n        ')
                __M_writer(escape(FORMS.NEW_FOLDER_FORM('folder-new', result.folder.workspace.id, result.folder.id)))
                __M_writer('\n')
            __M_writer('    <p>\n        ')
            __M_writer(escape(WIDGETS.FOLDER_LIST('subfolder-list', result.folder.workspace.id, fake_api.current_folder_subfolders)))
            __M_writer('\n    </p>\n    <hr/>\n')
        __M_writer('\n')
        if result.folder.allowed_content.thread:
            __M_writer('    ')
            __M_writer(escape(WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.folder.workspace, 'threads', _('Threads'), 'thread-new', _('start new thread...'))))
            __M_writer('\n    ')
            __M_writer(escape(FORMS.NEW_THREAD_FORM('thread-new', result.folder.workspace.id, result.folder.id)))
            __M_writer('\n\n    <p>\n        ')
            __M_writer(escape(WIDGETS.THREAD_LIST('thread-list', result.folder.workspace.id, fake_api.current_folder_threads)))
            __M_writer('\n    </p>\n    <hr/>\n')
        __M_writer('\n')
        if result.folder.allowed_content.file:
            __M_writer('    ')
            __M_writer(escape(WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.folder.workspace, 'files', _('Files'), 'file-new', _('add new file...'))))
            __M_writer('\n    ')
            __M_writer(escape(FORMS.NEW_FILE_FORM('file-new', result.folder.workspace.id, result.folder.id)))
            __M_writer('\n\n    <p>\n        ')
            __M_writer(escape(WIDGETS.FILE_LIST('thread-list', result.folder.workspace.id, fake_api.current_folder_files)))
            __M_writer('\n    </p>\n    <hr/>\n')
        __M_writer('\n')
        if result.folder.allowed_content.page:
            __M_writer('    ')
            __M_writer(escape(WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.folder.workspace, 'pages', _('Pages'), 'page-new', _('create new page...'))))
            __M_writer('\n    ')
            __M_writer(escape(FORMS.NEW_PAGE_FORM('page-new', result.folder.workspace.id, result.folder.id)))
            __M_writer('\n\n    <p>\n        ')
            __M_writer(escape(WIDGETS.PAGE_LIST('page-list', result.folder.workspace.id, fake_api.current_folder_pages)))
            __M_writer('\n    </p>\n    <hr/>\n')
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
        __M_writer('\n    ')
        __M_writer(escape(TIM.MODAL_DIALOG('folder-edit-modal-dialog')))
        __M_writer('\n    ')
        __M_writer(escape(TIM.MODAL_DIALOG('folder-move-modal-dialog')))
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_SIDEBAR_RIGHT_CONTENT(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        fake_api = context.get('fake_api', UNDEFINED)
        result = context.get('result', UNDEFINED)
        TOOLBAR = _mako_get_namespace(context, 'TOOLBAR')
        __M_writer = context.writer()
        __M_writer('\n    ')
        __M_writer(escape(TOOLBAR.SECURED_FOLDER(fake_api.current_user, result.folder.workspace, result.folder)))
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
        __M_writer(escape(WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__folder_{}'.format(result.folder.workspace.id, result.folder.id))))
        __M_writer('\n    <hr/>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        result = context.get('result', UNDEFINED)
        __M_writer = context.writer()
        __M_writer(escape(result.folder.label))
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"23": 5, "26": 3, "29": 6, "32": 4, "38": 0, "50": 1, "51": 3, "52": 4, "53": 5, "54": 6, "55": 8, "56": 14, "57": 18, "58": 24, "59": 31, "60": 33, "61": 33, "62": 33, "63": 33, "64": 35, "65": 35, "66": 37, "67": 37, "68": 40, "69": 40, "70": 43, "71": 43, "72": 44, "73": 45, "74": 45, "75": 45, "76": 47, "77": 48, "78": 48, "79": 48, "80": 50, "81": 51, "82": 51, "83": 51, "84": 53, "85": 54, "86": 54, "87": 54, "88": 56, "89": 59, "90": 60, "91": 61, "92": 61, "93": 61, "94": 62, "95": 63, "96": 63, "97": 63, "98": 64, "99": 64, "100": 66, "101": 67, "102": 67, "103": 71, "104": 72, "105": 73, "106": 73, "107": 73, "108": 74, "109": 74, "110": 77, "111": 77, "112": 81, "113": 82, "114": 83, "115": 83, "116": 83, "117": 84, "118": 84, "119": 87, "120": 87, "121": 91, "122": 92, "123": 93, "124": 93, "125": 93, "126": 94, "127": 94, "128": 97, "129": 97, "135": 20, "140": 20, "141": 21, "142": 21, "143": 22, "144": 22, "145": 23, "146": 23, "152": 16, "159": 16, "160": 17, "161": 17, "167": 10, "174": 10, "175": 11, "176": 11, "177": 12, "178": 12, "184": 8, "189": 8, "195": 189}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_folder_get_one.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_folder_get_one.mak"}
__M_END_METADATA
"""
