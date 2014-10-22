# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984364.005786
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_forms.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_forms.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['NEW_PAGE_FORM', 'USER_PASSWORD_EDIT_FORM', 'NEW_FILE_FORM', 'ITEM_MOVE_FORM', 'NEW_THREAD_FORM', 'EDIT_FOLDER_FORM', 'NEW_FOLDER_FORM', 'NEW_FILE_REVISION_WITH_COMMENT_FORM', 'USER_EDIT_FORM', 'NEW_COMMENT_FORM_IN_THREAD']


def _mako_get_namespace(context, name):
    try:
        return context.namespaces[(__name__, name)]
    except KeyError:
        _mako_generate_namespaces(context)
        return context.namespaces[(__name__, name)]
def _mako_generate_namespaces(context):
    ns = runtime.TemplateNamespace('WIDGETS', context._clean_inheritance_tokens(), templateuri='tracim.templates.user_workspace_widgets', callables=None,  calling_uri=_template_uri)
    context.namespaces[(__name__, 'WIDGETS')] = ns

    ns = runtime.TemplateNamespace('TIM', context._clean_inheritance_tokens(), templateuri='tracim.templates.pod', callables=None,  calling_uri=_template_uri)
    context.namespaces[(__name__, 'TIM')] = ns

def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        __M_writer = context.writer()
        __M_writer('\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n\n\n')
        __M_writer('\n\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_NEW_PAGE_FORM(context,dom_id,workspace_id,parent_id=None):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <div id="')
        __M_writer(escape(dom_id))
        __M_writer('" class="collapse">\n        <div class="pod-inline-form" >\n            <form method="POST" action="')
        __M_writer(escape(tg.url('/workspaces/{}/folders/{}/pages').format(workspace_id, parent_id)))
        __M_writer('">\n                <div class="form-group">\n                    <label for="page-title">')
        __M_writer(escape(_('Page title')))
        __M_writer('</label>\n                    <input name="label" type="text" class="form-control" id="page-title" placeholder="')
        __M_writer(escape(_('Title')))
        __M_writer('">\n                </div>\n                <div class="form-group">\n                    <label for="page-content">')
        __M_writer(escape(_('Content')))
        __M_writer('</label>\n                    <textarea id="page-content-textarea" name="content" class="form-control pod-rich-textarea" id="page-content" placeholder="')
        __M_writer(escape(_('Write here the page content')))
        __M_writer('"></textarea>\n                </div>\n                <span class="pull-right" style="margin-top: 0.5em;">\n                    <button id="')
        __M_writer(escape(dom_id))
        __M_writer('-submit-button" type="submit" class="btn btn-small btn-success" title="')
        __M_writer(escape(_('Create this page')))
        __M_writer('"><i class=" fa fa-check"></i> ')
        __M_writer(escape(_('Validate')))
        __M_writer('</button>\n                </span>\n                \n                <div style="clear: both;"></div>\n            </form>\n        </div>\n        <hr/>\n    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_USER_PASSWORD_EDIT_FORM(context,dom_id,user,target_url):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer("\n    <form id='")
        __M_writer(escape(dom_id))
        __M_writer('\' role="form" method="POST" action="')
        __M_writer(escape(target_url))
        __M_writer('">\n        <div class="modal-header">\n            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">')
        __M_writer(escape(_('Close')))
        __M_writer('</span></button>\n            <h4 class="modal-title">')
        __M_writer(escape(TIM.ICO(32, 'actions/system-lock-screen')))
        __M_writer(' ')
        __M_writer(escape(_('Change password')))
        __M_writer('</h4>\n        </div>\n        <div class="modal-body">\n            <div class="form-group">\n                <label for="currentPassword" class="control-label">')
        __M_writer(escape(_('Current password')))
        __M_writer('</label>\n                <div><input class="form-control" type="password" id="currentPassword" name="current_password" placeholder="')
        __M_writer(escape(_('Current password')))
        __M_writer('"></div>\n            </div>\n            <div class="form-group">\n                <label for="newPassword1" class="control-label">')
        __M_writer(escape(_('New password')))
        __M_writer('</label>\n                <div><input class="form-control" type="password" id="newPassword1" name="new_password1" placeholder="')
        __M_writer(escape(_('New password')))
        __M_writer('"></div>\n            </div>\n            <div class="form-group">\n                <label for="newPassword2" class="control-label">')
        __M_writer(escape(_('Retype password')))
        __M_writer('</label>\n                    <div><input class="form-control" type="password" id="newPassword2" name="new_password2" placeholder="')
        __M_writer(escape(_('Retype password')))
        __M_writer('"></div>\n                </div>\n            </div>\n            <div class="modal-footer">\n                <button type="submit" class="btn btn-success pull-right"><i class="fa fa-check"></i> ')
        __M_writer(escape(_('Save changes')))
        __M_writer('</button>\n            </div>\n        </div>\n    </form>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_NEW_FILE_FORM(context,dom_id,workspace_id,parent_id=None):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <div id="')
        __M_writer(escape(dom_id))
        __M_writer('" class="collapse">\n        <div class="pod-inline-form" >\n            <form role="form" method="POST" enctype="multipart/form-data" action="')
        __M_writer(escape(tg.url('/workspaces/{}/folders/{}/files').format(workspace_id, parent_id)))
        __M_writer('">\n                <div class="form-group">\n                    <label for="file-label">')
        __M_writer(escape(_('Title (optionnal)')))
        __M_writer('</label>\n                    <input id="file-label" class="form-control" name="label" type="text" placeholder="')
        __M_writer(escape(_('you can give a title to this file')))
        __M_writer('">\n                </div>\n                <div class="form-group">\n                    <label for="file-object">')
        __M_writer(escape(_('Select a file')))
        __M_writer('</label>\n                    <input id="file-object" name="file_data" type="file" placeholder="')
        __M_writer(escape(_('choose a file')))
        __M_writer('">\n                </div>\n                <span class="pull-right" style="margin-top: 0.5em;">\n                    <button id="')
        __M_writer(escape(dom_id))
        __M_writer('-submit-button" type="submit" class="btn btn-small btn-success" title="')
        __M_writer(escape(_('Validate')))
        __M_writer('"><i class=" fa fa-check"></i> ')
        __M_writer(escape(_('Validate')))
        __M_writer('</button>\n                </span>\n                \n                <div style="clear: both;"></div>\n            </form>\n        </div>\n        <hr/>\n    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_ITEM_MOVE_FORM(context,dom_id,item,do_move_url,modal_title):
    __M_caller = context.caller_stack._push_frame()
    try:
        WIDGETS = _mako_get_namespace(context, 'WIDGETS')
        TIM = _mako_get_namespace(context, 'TIM')
        dict = context.get('dict', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <form role="form" method="POST" action="')
        __M_writer(escape(do_move_url))
        __M_writer('">\n        <div class="modal-header">\n            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">')
        __M_writer(escape(_('Close')))
        __M_writer('</span></button>\n            <h4 class="modal-title" id="myModalLabel">')
        __M_writer(escape(TIM.ICO(32, 'actions/item-move')))
        __M_writer(' ')
        __M_writer(escape(modal_title))
        __M_writer('</h4>\n        </div>\n        <div class="modal-body">\n            ')

        selected_id = 'workspace_{}__folder_{}'.format(item.workspace.id, item.folder.id if item.folder else '')
        get_root_url = tg.url("/workspaces/treeview_root", dict(current_id=selected_id, all_workspaces=0, folder_allowed_content_types='folder', ignore_id=item.id))
        get_children_url = tg.url("/workspaces/treeview_children", dict(removed_item=item.id, ignore_id=item.id))
                    
        
        __M_writer('\n\n            ')
        __M_writer(escape(WIDGETS.TREEVIEW_DYNAMIC('move-item-treeview', selected_id, get_root_url, get_children_url, 'move_mode')))
        __M_writer('\n        </div>\n        <div class="modal-footer">\n            <span class="pull-right" style="margin-top: 0.5em;">\n                <button id="folder-save-button" type="submit" class="btn btn-small btn-success" title="')
        __M_writer(escape(_('Validate')))
        __M_writer('"><i class="fa fa-check"></i> ')
        __M_writer(escape(_('Validate')))
        __M_writer('</button>\n            </span>\n        </div>\n    </form> \n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_NEW_THREAD_FORM(context,dom_id,workspace_id,parent_id=None):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <div id="')
        __M_writer(escape(dom_id))
        __M_writer('" class="collapse">\n        <div class="pod-inline-form" >\n            <form role="form" method="POST" action="')
        __M_writer(escape(tg.url('/workspaces/{}/folders/{}/threads').format(workspace_id, parent_id)))
        __M_writer('">\n                <div class="form-group">\n                    <label for="thread-name">')
        __M_writer(escape(_('Subject')))
        __M_writer('</label>\n                    <input id="thread-name" class="form-control" name="label" type="text" placeholder="')
        __M_writer(escape(_('...')))
        __M_writer('">\n                </div>\n                <div class="form-group">\n                    <label for="thread-message">')
        __M_writer(escape(_('Message')))
        __M_writer('</label>\n                    <textarea id="thread-message" class="form-control pod-rich-textarea" name="content" type="text" placeholder="')
        __M_writer(escape(_('...')))
        __M_writer('"></textarea>\n                </div>\n                <span class="pull-right" style="margin-top: 0.5em;">\n                    <button id="')
        __M_writer(escape(dom_id))
        __M_writer('-submit-button" type="submit" class="btn btn-small btn-success" title="')
        __M_writer(escape(_('Create this page')))
        __M_writer('"><i class=" fa fa-check"></i> ')
        __M_writer(escape(_('Validate')))
        __M_writer('</button>\n                </span>\n                \n                <div style="clear: both;"></div>\n            </form>\n        </div>\n        <hr/>\n    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_EDIT_FOLDER_FORM(context,dom_id,folder):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        TIM = _mako_get_namespace(context, 'TIM')
        __M_writer = context.writer()
        __M_writer('\n    <form role="form" method="POST" action="')
        __M_writer(escape(tg.url('/workspaces/{}/folders/{}?_method=PUT').format(folder.workspace.id, folder.id)))
        __M_writer('">\n        <div class="modal-header">\n            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">')
        __M_writer(escape(_('Close')))
        __M_writer('</span></button>\n            <h4 class="modal-title" id="myModalLabel">')
        __M_writer(escape(TIM.ICO(32, 'apps/internet-group-chat')))
        __M_writer(' ')
        __M_writer(escape(_('Edit Folder')))
        __M_writer('</h4>\n        </div>\n        <div class="modal-body">\n            <div class="form-group">\n                <label for="folder-name">')
        __M_writer(escape(_('Name')))
        __M_writer('</label>\n                <input name="label" type="text" class="form-control" id="name" placeholder="')
        __M_writer(escape(_('Name')))
        __M_writer('" value="')
        __M_writer(escape(folder.label))
        __M_writer('">\n            </div>\n            <p>\n                ')
        __M_writer(escape(_('This folder may contain:')))
        __M_writer('\n            </p>\n            <div class="checkbox">\n                ')
        checked = ('', 'checked')[folder.allowed_content.folder] 
        
        __M_writer('\n                <label><input name="can_contain_folders" type="checkbox" ')
        __M_writer(escape(checked))
        __M_writer('> ')
        __M_writer(escape(TIM.ICO(16, 'places/jstree-folder')))
        __M_writer(' ')
        __M_writer(escape(_('sub-folders')))
        __M_writer('</label>\n            </div>\n            <div class="checkbox">\n                ')
        checked = ('', 'checked')[folder.allowed_content.thread] 
        
        __M_writer('\n                <label><input name="can_contain_threads" type="checkbox" ')
        __M_writer(escape(checked))
        __M_writer('> ')
        __M_writer(escape(TIM.ICO(16, 'apps/internet-group-chat')))
        __M_writer(' ')
        __M_writer(escape(_('threads')))
        __M_writer('</label>\n            </div>\n            <div class="checkbox">\n                ')
        checked = ('', 'checked')[folder.allowed_content.file] 
        
        __M_writer('\n                <label><input name="can_contain_files" type="checkbox" ')
        __M_writer(escape(checked))
        __M_writer('> ')
        __M_writer(escape(TIM.ICO(16, 'mimetypes/text-x-generic-template')))
        __M_writer(' ')
        __M_writer(escape(_('files')))
        __M_writer('</label>\n            </div>\n            <div class="checkbox">\n                ')
        checked = ('', 'checked')[folder.allowed_content.page] 
        
        __M_writer('\n                <label><input name="can_contain_pages" type="checkbox" ')
        __M_writer(escape(checked))
        __M_writer('> ')
        __M_writer(escape(TIM.ICO(16, 'mimetypes/text-html')))
        __M_writer(' ')
        __M_writer(escape(_('Wiki pages')))
        __M_writer(' </label>\n            </div>\n        </div>\n        <div class="modal-footer">\n            <span class="pull-right" style="margin-top: 0.5em;">\n                <button id="folder-save-button" type="submit" class="btn btn-small btn-success" title="')
        __M_writer(escape(_('Validate')))
        __M_writer('"><i class="fa fa-check"></i> ')
        __M_writer(escape(_('Validate')))
        __M_writer('</button>\n            </span>\n        </div>\n    </form> \n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_NEW_FOLDER_FORM(context,dom_id,workspace_id,parent_id=None):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        _ = context.get('_', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <div id="')
        __M_writer(escape(dom_id))
        __M_writer('" class="collapse">\n        <div class="pod-inline-form" >\n            <form method="POST" action="')
        __M_writer(escape(tg.url('/workspaces/{}/folders').format(workspace_id)))
        __M_writer('">\n                <input type="hidden" name="parent_id" value="')
        __M_writer(escape(parent_id))
        __M_writer('">\n                <p>\n                    <label for="folder-name">')
        __M_writer(escape(_('Folder name')))
        __M_writer('</label>\n                    <input id="folder-name" name="label" type="text">\n                </p>\n                <p>\n                    ')
        __M_writer(escape(_('This folder may contain:')))
        __M_writer('\n                </p>\n                <p>\n                    <label><input id="content-folders" name="can_contain_folders" type="checkbox"> ')
        __M_writer(escape(TIM.ICO(16, 'places/jstree-folder')))
        __M_writer(' ')
        __M_writer(escape(_('sub-folders')))
        __M_writer('</label><br/>\n                    <label><input id="content-threads" name="can_contain_threads" type="checkbox"> ')
        __M_writer(escape(TIM.ICO(16, 'apps/internet-group-chat')))
        __M_writer(' ')
        __M_writer(escape(_('threads')))
        __M_writer('</label><br/>\n                    <label><input id="content-files" name="can_contain_files" type="checkbox"> ')
        __M_writer(escape(TIM.ICO(16, 'mimetypes/text-x-generic-template')))
        __M_writer(' ')
        __M_writer(escape(_('files')))
        __M_writer('</label><br/>\n                    <label><input id="content-pages" name="can_contain_pages" type="checkbox"> ')
        __M_writer(escape(TIM.ICO(16, 'mimetypes/text-html')))
        __M_writer(' ')
        __M_writer(escape(_('Wiki pages')))
        __M_writer('</label>\n                    ')
        __M_writer(escape(TIM.HELP_MODAL_DIALOG_BUTTON('content-wiki-page-definition', 'margin-left: 0.5em;')))
        __M_writer('\n                </p>\n\n                <span class="pull-right" style="margin-top: 0.5em;">\n                    <button id="')
        __M_writer(escape(dom_id))
        __M_writer('-submit-button" type="submit" class="btn btn-small btn-success" title="')
        __M_writer(escape(_('Create this folder')))
        __M_writer('"><i class=" fa fa-check"></i> ')
        __M_writer(escape(_('Validate')))
        __M_writer('</button>\n                </span>\n                \n                <div style="clear: both;"></div>\n            </form>\n        </div>\n        <hr/>\n    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_NEW_FILE_REVISION_WITH_COMMENT_FORM(context,dom_id,workspace_id,folder_id,file_id=None):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <div id="')
        __M_writer(escape(dom_id))
        __M_writer('" class="collapse">\n        <div class="pod-inline-form" >\n')
        if file_id:
            __M_writer('                <form role="form" method="POST" enctype="multipart/form-data" action="')
            __M_writer(escape(tg.url('/workspaces/{}/folders/{}/files/{}?_method=PUT').format(workspace_id, folder_id, file_id)))
            __M_writer('">\n')
        else:
            __M_writer('                <form role="form" method="POST" enctype="multipart/form-data" action="')
            __M_writer(escape(tg.url('/workspaces/{}/folders/{}/files').format(workspace_id, folder_id)))
            __M_writer('">\n')
        __M_writer('                <div class="form-group">\n                    <label for="file-object">')
        __M_writer(escape(_('Select new file revision')))
        __M_writer('</label>\n                    <input id="file-object" name="file_data" type="file" placeholder="')
        __M_writer(escape(_('choose a file')))
        __M_writer('">\n                </div>\n                <div class="form-group">\n                    <label for="file-label">')
        __M_writer(escape(_('Your comment...')))
        __M_writer('</label>\n                    <textarea id="file-label" class="form-control pod-rich-textarea" name="comment" type="text" placeholder=""></textarea>\n                </div>\n                <span class="pull-right" style="margin-top: 0.5em;">\n                    <button id="')
        __M_writer(escape(dom_id))
        __M_writer('-submit-button" type="submit" class="btn btn-small btn-success" title="')
        __M_writer(escape(_('Validate')))
        __M_writer('"><i class=" fa fa-check"></i> ')
        __M_writer(escape(_('Validate')))
        __M_writer('</button>\n                </span>\n                \n                <div style="clear: both;"></div>\n            </form>\n        </div>\n        <hr/>\n    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_USER_EDIT_FORM(context,dom_id,user,target_url):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <form id="')
        __M_writer(escape(dom_id))
        __M_writer('" role="form" method="POST" action="')
        __M_writer(escape(target_url))
        __M_writer('">\n        <div class="modal-header">\n            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>\n            <h4 class="modal-title" id="myModalLabel">')
        __M_writer(escape(TIM.ICO(32, 'actions/contact-new')))
        __M_writer(' ')
        __M_writer(escape(_('Edit User')))
        __M_writer('</h4>\n        </div>\n        <div class="modal-body">\n            <div class="form-group">\n                <label for="name">')
        __M_writer(escape(_('Name')))
        __M_writer('</label>\n                <input name="name" type="text" class="form-control" id="name" placeholder="')
        __M_writer(escape(_('Name')))
        __M_writer('" value="')
        __M_writer(escape(user.name))
        __M_writer('">\n            </div>\n            <div class="form-group">\n                <label for="email">')
        __M_writer(escape(_('Email')))
        __M_writer('</label>\n                <input name="email" type="text" class="form-control" id="email" placeholder="')
        __M_writer(escape(_('Name')))
        __M_writer('" value="')
        __M_writer(escape(user.email))
        __M_writer('">\n            </div>\n        </div>\n        <div class="modal-footer">\n            <span class="pull-right" style="margin-top: 0.5em;">\n                <button type="submit" class="btn btn-small btn-success" title="Add first comment"><i class=" fa fa-check"></i> ')
        __M_writer(escape(_('Validate')))
        __M_writer('</button>\n            </span>\n        </div>\n    </form>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_NEW_COMMENT_FORM_IN_THREAD(context,dom_id,workspace_id,folder_id,thread_id):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <div id="')
        __M_writer(escape(dom_id))
        __M_writer('" class="collapse">\n        <div class="pod-inline-form" >\n            <form role="form" method="POST" action="')
        __M_writer(escape(tg.url('/workspaces/{}/folders/{}/threads/{}/comments').format(workspace_id, folder_id, thread_id)))
        __M_writer('">\n                <div class="form-group">\n                    <label for="thread-message">')
        __M_writer(escape(_('Your message')))
        __M_writer('</label>\n                    <textarea id="thread-message" class="form-control pod-rich-textarea" name="content" type="text" placeholder="')
        __M_writer(escape(_('...')))
        __M_writer('"></textarea>\n                </div>\n                <span class="pull-right" style="margin-top: 0.5em;">\n                    <button id="')
        __M_writer(escape(dom_id))
        __M_writer('-submit-button" type="submit" class="btn btn-small btn-success" title="')
        __M_writer(escape(_('Validate')))
        __M_writer('"><i class=" fa fa-check"></i> ')
        __M_writer(escape(_('Validate')))
        __M_writer('</button>\n                </span>\n                \n                <div style="clear: both;"></div>\n            </form>\n        </div>\n        <hr/>\n    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"23": 2, "26": 1, "29": 0, "34": 1, "35": 2, "36": 33, "37": 72, "38": 97, "39": 121, "40": 144, "41": 167, "42": 194, "43": 213, "44": 237, "45": 264, "51": 100, "57": 100, "58": 101, "59": 101, "60": 103, "61": 103, "62": 105, "63": 105, "64": 106, "65": 106, "66": 109, "67": 109, "68": 110, "69": 110, "70": 113, "71": 113, "72": 113, "73": 113, "74": 113, "75": 113, "81": 239, "87": 239, "88": 240, "89": 240, "90": 240, "91": 240, "92": 242, "93": 242, "94": 243, "95": 243, "96": 243, "97": 243, "98": 247, "99": 247, "100": 248, "101": 248, "102": 251, "103": 251, "104": 252, "105": 252, "106": 255, "107": 255, "108": 256, "109": 256, "110": 260, "111": 260, "117": 146, "123": 146, "124": 147, "125": 147, "126": 149, "127": 149, "128": 151, "129": 151, "130": 152, "131": 152, "132": 155, "133": 155, "134": 156, "135": 156, "136": 159, "137": 159, "138": 159, "139": 159, "140": 159, "141": 159, "147": 76, "156": 76, "157": 77, "158": 77, "159": 79, "160": 79, "161": 80, "162": 80, "163": 80, "164": 80, "165": 83, "171": 87, "172": 89, "173": 89, "174": 93, "175": 93, "176": 93, "177": 93, "183": 123, "189": 123, "190": 124, "191": 124, "192": 126, "193": 126, "194": 128, "195": 128, "196": 129, "197": 129, "198": 132, "199": 132, "200": 133, "201": 133, "202": 136, "203": 136, "204": 136, "205": 136, "206": 136, "207": 136, "213": 35, "220": 35, "221": 36, "222": 36, "223": 38, "224": 38, "225": 39, "226": 39, "227": 39, "228": 39, "229": 43, "230": 43, "231": 44, "232": 44, "233": 44, "234": 44, "235": 47, "236": 47, "237": 50, "239": 50, "240": 51, "241": 51, "242": 51, "243": 51, "244": 51, "245": 51, "246": 54, "248": 54, "249": 55, "250": 55, "251": 55, "252": 55, "253": 55, "254": 55, "255": 58, "257": 58, "258": 59, "259": 59, "260": 59, "261": 59, "262": 59, "263": 59, "264": 62, "266": 62, "267": 63, "268": 63, "269": 63, "270": 63, "271": 63, "272": 63, "273": 68, "274": 68, "275": 68, "276": 68, "282": 4, "289": 4, "290": 5, "291": 5, "292": 7, "293": 7, "294": 8, "295": 8, "296": 10, "297": 10, "298": 14, "299": 14, "300": 17, "301": 17, "302": 17, "303": 17, "304": 18, "305": 18, "306": 18, "307": 18, "308": 19, "309": 19, "310": 19, "311": 19, "312": 20, "313": 20, "314": 20, "315": 20, "316": 21, "317": 21, "318": 25, "319": 25, "320": 25, "321": 25, "322": 25, "323": 25, "329": 169, "335": 169, "336": 170, "337": 170, "338": 172, "339": 173, "340": 173, "341": 173, "342": 174, "343": 175, "344": 175, "345": 175, "346": 177, "347": 178, "348": 178, "349": 179, "350": 179, "351": 182, "352": 182, "353": 186, "354": 186, "355": 186, "356": 186, "357": 186, "358": 186, "364": 215, "370": 215, "371": 216, "372": 216, "373": 216, "374": 216, "375": 219, "376": 219, "377": 219, "378": 219, "379": 223, "380": 223, "381": 224, "382": 224, "383": 224, "384": 224, "385": 227, "386": 227, "387": 228, "388": 228, "389": 228, "390": 228, "391": 233, "392": 233, "398": 196, "404": 196, "405": 197, "406": 197, "407": 199, "408": 199, "409": 201, "410": 201, "411": 202, "412": 202, "413": 205, "414": 205, "415": 205, "416": 205, "417": 205, "418": 205, "424": 418}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_forms.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_forms.mak"}
__M_END_METADATA
"""
