# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984364.207344
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/folder_toolbars.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/folder_toolbars.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['SECURED_FOLDER']


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
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_SECURED_FOLDER(context,user,workspace,folder):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        h = context.get('h', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    ')
        edit_disabled = ('', 'disabled')[folder.selected_revision!='latest' or folder.status.id[:6]=='closed'] 
        
        __M_writer('\n    ')

        ## FIXME - This control should be based on the user role
        move_disabled = ('', 'disabled')[folder.selected_revision!='latest' or folder.status.id[:6]=='closed']
            
        
        __M_writer('\n    \n    ')
        delete_or_archive_disabled = ('', 'disabled')[folder.selected_revision!='latest'] 
        
        __M_writer(' \n')
        if h.user_role(user, workspace)>2:
            __M_writer('        <div class="btn-group btn-group-vertical">\n')
            __M_writer('            <a title="')
            __M_writer(escape(_('Edit current folder')))
            __M_writer('" class="btn btn-default ')
            __M_writer(escape(edit_disabled))
            __M_writer('" data-toggle="modal" data-target="#folder-edit-modal-dialog" data-remote="')
            __M_writer(escape(tg.url('/workspaces/{}/folders/{}/edit'.format(folder.workspace.id, folder.id))))
            __M_writer('" >')
            __M_writer(escape(TIM.ICO(32, 'apps/accessories-text-editor')))
            __M_writer('</a>\n        </div>\n        <p></p>\n')
        __M_writer('    \n    <div class="btn-group btn-group-vertical">\n')
        if user.profile.id>=3 or h.user_role(user, workspace)>=4:
            __M_writer('            <a title="')
            __M_writer(escape(_('Move current folder')))
            __M_writer('" class="btn btn-default ')
            __M_writer(escape(move_disabled))
            __M_writer('" data-toggle="modal" data-target="#folder-move-modal-dialog" data-remote="')
            __M_writer(escape(tg.url('/workspaces/{}/folders/{}/location/{}/edit'.format(folder.workspace.id, folder.id, folder.id))))
            __M_writer('" >')
            __M_writer(escape(TIM.ICO(32, 'actions/item-move')))
            __M_writer('</a>\n')
        __M_writer('    </div>\n    <p></p>\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"23": 1, "26": 0, "31": 1, "32": 27, "38": 3, "46": 3, "47": 4, "49": 4, "50": 5, "55": 8, "56": 10, "58": 10, "59": 11, "60": 12, "61": 14, "62": 14, "63": 14, "64": 14, "65": 14, "66": 14, "67": 14, "68": 14, "69": 14, "70": 18, "71": 20, "72": 22, "73": 22, "74": 22, "75": 22, "76": 22, "77": 22, "78": 22, "79": 22, "80": 22, "81": 24, "87": 81}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/folder_toolbars.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/folder_toolbars.mak"}
__M_END_METADATA
"""
