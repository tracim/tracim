# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984364.150558
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_widgets.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_widgets.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['SECURED_SHOW_CHANGE_STATUS_FOR_THREAD', 'SECURED_SECTION_TITLE', 'THREAD_LIST', 'SECURED_SHOW_CHANGE_STATUS_FOR_FILE', 'EMPTY_CONTENT', 'SECURED_SHOW_CHANGE_STATUS_FOR_PAGE', 'BREADCRUMB', 'FOLDER_LIST', 'PAGE_LIST', 'FILE_LIST', 'DATA_TARGET_BUTTON', 'TREEVIEW', 'SHOW_CHANGE_STATUS', 'TREEVIEW_DYNAMIC']


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
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
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


def render_SECURED_SHOW_CHANGE_STATUS_FOR_THREAD(context,user,workspace,item):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        def SHOW_CHANGE_STATUS(item,target_url,allow_to_change_status=False):
            return render_SHOW_CHANGE_STATUS(context,item,target_url,allow_to_change_status)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    ')
        target_url = tg.url('/workspaces/{wid}/folders/{fid}/threads/{pid}/put_status?status={{status_id}}').format(wid=item.workspace.id, fid=item.parent.id, pid=item.id) 
        
        __M_writer('\n    ')
        allow_status_change = h.user_role(user, workspace)>=2 and item.selected_revision=='latest' 
        
        __M_writer('\n')
        __M_writer('    ')
        __M_writer(escape(SHOW_CHANGE_STATUS(item, target_url, allow_status_change)))
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_SECURED_SECTION_TITLE(context,user,workspace,dom_id,label,action_dom_id='',action_label='',icon_size='',icon_path=''):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        TIM = _mako_get_namespace(context, 'TIM')
        def DATA_TARGET_BUTTON(dom_id,label):
            return render_DATA_TARGET_BUTTON(context,dom_id,label)
        __M_writer = context.writer()
        __M_writer('\n    <h4 id="')
        __M_writer(escape(dom_id))
        __M_writer('">\n        ')
        __M_writer(escape(TIM.ICO(icon_size, icon_path) if icon_path else ''))
        __M_writer('\n        ')
        __M_writer(escape(label))
        __M_writer('\n        \n')
        if h.user_role(user, workspace)>1: 
            if action_dom_id and action_label:
                __M_writer('                <small style="margin-left: 1em;"> ')
                __M_writer(escape(DATA_TARGET_BUTTON(action_dom_id, action_label)))
                __M_writer('</small>    \n')
        __M_writer('    </h4>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_THREAD_LIST(context,dom_id,workspace_id,threads):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        def EMPTY_CONTENT(empty_content_label):
            return render_EMPTY_CONTENT(context,empty_content_label)
        len = context.get('len', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n')
        if len(threads)<=0:
            __M_writer('        ')
            __M_writer(escape(EMPTY_CONTENT(_('No thread found.'))))
            __M_writer('\n')
        else:
            __M_writer('        <table id="')
            __M_writer(escape(dom_id))
            __M_writer('" class="table table-striped table-hover">\n')
            for thread in threads:
                __M_writer('                <tr>\n                    <td><a href="')
                __M_writer(escape(tg.url('/workspaces/{}/folders/{}/threads/{}'.format(workspace_id, thread.folder.id, thread.id))))
                __M_writer('">')
                __M_writer(escape(TIM.ICO(16, 'apps/internet-group-chat')))
                __M_writer(' ')
                __M_writer(escape(thread.label))
                __M_writer('</a></td>\n                    <td>')
                __M_writer(escape(TIM.ICO(16, thread.status.icon)))
                __M_writer(' <span class="')
                __M_writer(escape(thread.status.css))
                __M_writer('">')
                __M_writer(escape(thread.status.label))
                __M_writer('</span></td>\n                    <td>')
                __M_writer(escape(_('{} message(s)').format(thread.comment_nb)))
                __M_writer('</td>\n                </tr>\n')
            __M_writer('        </table>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_SECURED_SHOW_CHANGE_STATUS_FOR_FILE(context,user,workspace,item):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        def SHOW_CHANGE_STATUS(item,target_url,allow_to_change_status=False):
            return render_SHOW_CHANGE_STATUS(context,item,target_url,allow_to_change_status)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    ')
        target_url = tg.url('/workspaces/{wid}/folders/{fid}/files/{pid}/put_status?status={{status_id}}').format(wid=item.workspace.id, fid=item.parent.id, pid=item.id) 
        
        __M_writer('\n    ')
        allow_status_change = h.user_role(user, workspace)>=2 and item.selected_revision=='latest' 
        
        __M_writer('\n    ')
        __M_writer(escape(SHOW_CHANGE_STATUS(item, target_url, allow_status_change)))
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_EMPTY_CONTENT(context,empty_content_label):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        __M_writer('<p class="pod-empty">')
        __M_writer(escape(empty_content_label))
        __M_writer('</p>')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_SECURED_SHOW_CHANGE_STATUS_FOR_PAGE(context,user,workspace,item):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        def SHOW_CHANGE_STATUS(item,target_url,allow_to_change_status=False):
            return render_SHOW_CHANGE_STATUS(context,item,target_url,allow_to_change_status)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    ')
        target_url = tg.url('/workspaces/{wid}/folders/{fid}/pages/{pid}/put_status?status={{status_id}}').format(wid=item.workspace.id, fid=item.parent.id, pid=item.id) 
        
        __M_writer('\n    ')
        allow_status_change = h.user_role(user, workspace)>=2 and item.selected_revision=='latest' 
        
        __M_writer('\n    ')
        __M_writer(escape(SHOW_CHANGE_STATUS(item, target_url, allow_status_change)))
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_BREADCRUMB(context,dom_id,breadcrumb_items):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        __M_writer = context.writer()
        __M_writer('\n    <ul id="')
        __M_writer(escape(dom_id))
        __M_writer('" class="breadcrumb" style="margin-top: -1.5em; display: none;">\n')
        for item in breadcrumb_items:
            if item.is_active:
                __M_writer('                <li class="active">')
                __M_writer(escape(TIM.ICO(16, item.icon)))
                __M_writer(' ')
                __M_writer(escape(item.label))
                __M_writer('</li>\n')
            else:
                __M_writer('                <li>')
                __M_writer(escape(TIM.ICO(16, item.icon)))
                __M_writer(' <a href="')
                __M_writer(escape(item.url))
                __M_writer('">')
                __M_writer(escape(item.label))
                __M_writer('</a></li>\n')
        __M_writer('    </ul>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_FOLDER_LIST(context,dom_id,workspace_id,folders):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        def EMPTY_CONTENT(empty_content_label):
            return render_EMPTY_CONTENT(context,empty_content_label)
        len = context.get('len', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n')
        if len(folders)<=0:
            __M_writer('        ')
            __M_writer(EMPTY_CONTENT(_('No folder found.')))
            __M_writer('\n')
        else:
            __M_writer('        <table id="')
            __M_writer(escape(dom_id))
            __M_writer('" class="table table-striped table-hover">\n')
            for folder in folders:
                __M_writer('                <tr>\n                    <td><a href="')
                __M_writer(escape(tg.url('/workspaces/{}/folders/{}'.format(workspace_id, folder.id))))
                __M_writer('">')
                __M_writer(escape(TIM.ICO(16, 'places/jstree-folder')))
                __M_writer(' ')
                __M_writer(escape(folder.label))
                __M_writer('</a></td>\n                    <td>\n')
                if folder.content_nb.all==0:
                    __M_writer('                            <span class="pod-empty-item">')
                    __M_writer(escape(_('This folder is empty')))
                    __M_writer('</span>\n')
                else:
                    if folder.folder_nb.all>=1:
                        __M_writer('                                ')
                        __M_writer(_('{nb_total} subfolder(s)').format(nb_total=folder.folder_nb.all))
                        __M_writer('\n')
                    __M_writer('                            \n')
                    if folder.thread_nb.all>=1:
                        __M_writer('                                ')
                        __M_writer(_('{nb_total} thread(s) &mdash; {nb_open} open').format(nb_total=folder.thread_nb.all, nb_open=folder.thread_nb.open))
                        __M_writer('\n                                <br/>\n')
                    __M_writer('\n')
                    if folder.file_nb.all>=1:
                        __M_writer('                                ')
                        __M_writer(_('{nb_total} file(s) &mdash; {nb_open} open').format(nb_total=folder.file_nb.all, nb_open=folder.file_nb.open))
                        __M_writer('\n                                <br/>\n')
                    __M_writer('\n')
                    if folder.page_nb.all>=1:
                        __M_writer('                                ')
                        __M_writer(_('{nb_total} page(s) &mdash; {nb_open} open').format(nb_total=folder.page_nb.all, nb_open=folder.page_nb.open))
                        __M_writer('\n                                <br/>\n')
                    __M_writer('\n')
                __M_writer('                    </td>\n                </tr>\n')
            __M_writer('        </table>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_PAGE_LIST(context,dom_id,workspace_id,pages):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        def EMPTY_CONTENT(empty_content_label):
            return render_EMPTY_CONTENT(context,empty_content_label)
        len = context.get('len', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n')
        if len(pages)<=0:
            __M_writer('        ')
            __M_writer(escape(EMPTY_CONTENT(_('No page found.'))))
            __M_writer('\n')
        else:
            __M_writer('        <table id="')
            __M_writer(escape(dom_id))
            __M_writer('" class="table table-striped table-hover">\n')
            for page in pages:
                __M_writer('                <tr>\n                    <td><a href="')
                __M_writer(escape(tg.url('/workspaces/{}/folders/{}/pages/{}'.format(workspace_id, page.folder.id, page.id))))
                __M_writer('">')
                __M_writer(escape(TIM.ICO(16, 'mimetypes/text-html')))
                __M_writer(' ')
                __M_writer(escape(page.label))
                __M_writer('</a></td>\n                    <td>\n                        ')
                __M_writer(escape(TIM.ICO(16, page.status.icon)))
                __M_writer(' <span class="')
                __M_writer(escape(page.status.css))
                __M_writer('">')
                __M_writer(escape(page.status.label))
                __M_writer('</span>\n                    </td>\n                </tr>\n')
            __M_writer('        </table>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_FILE_LIST(context,dom_id,workspace_id,files):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        def EMPTY_CONTENT(empty_content_label):
            return render_EMPTY_CONTENT(context,empty_content_label)
        len = context.get('len', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n')
        if len(files)<=0:
            __M_writer('        ')
            __M_writer(escape(EMPTY_CONTENT(_('No file found.'))))
            __M_writer('\n')
        else:
            __M_writer('        <table id="')
            __M_writer(escape(dom_id))
            __M_writer('" class="table table-striped table-hover">\n')
            for curfile in files:
                __M_writer('                <tr>\n                    <td><a href="')
                __M_writer(escape(tg.url('/workspaces/{}/folders/{}/files/{}'.format(workspace_id, curfile.folder.id, curfile.id))))
                __M_writer('">')
                __M_writer(escape(TIM.ICO(16, 'mimetypes/text-html')))
                __M_writer(' ')
                __M_writer(escape(curfile.label))
                __M_writer('</a></td>\n                    <td>\n                        ')
                __M_writer(escape(TIM.ICO(16, curfile.status.icon)))
                __M_writer(' <span class="')
                __M_writer(escape(curfile.status.css))
                __M_writer('">')
                __M_writer(escape(curfile.status.label))
                __M_writer('</span>\n                    </td>\n                </tr>\n')
            __M_writer('        </table>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_DATA_TARGET_BUTTON(context,dom_id,label):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        __M_writer('<a data-toggle="collapse" data-target="#')
        __M_writer(escape(dom_id))
        __M_writer('"><b>')
        __M_writer(escape(label))
        __M_writer('</b></a>')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_TREEVIEW(context,dom_id,selected_id='',uniq_workspace='0'):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        dict = context.get('dict', UNDEFINED)
        def TREEVIEW_DYNAMIC(dom_id,selected_id,get_root_url,get_children_url,mode='link_to_document'):
            return render_TREEVIEW_DYNAMIC(context,dom_id,selected_id,get_root_url,get_children_url,mode)
        __M_writer = context.writer()
        __M_writer('\n    ')

        get_root_url = tg.url("/workspaces/treeview_root", dict(current_id=selected_id))
        get_children_url = tg.url("/workspaces/treeview_children")
            
        
        __M_writer('\n    ')
        __M_writer(escape(TREEVIEW_DYNAMIC(dom_id, selected_id, get_root_url, get_children_url)))
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_SHOW_CHANGE_STATUS(context,item,target_url,allow_to_change_status=False):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        TIM = _mako_get_namespace(context, 'TIM')
        __M_writer = context.writer()
        __M_writer('\n    <div class="btn-group">\n')
        if not allow_to_change_status:
            __M_writer('            <button type="button" class="btn btn-default disable btn-link">\n                ')
            __M_writer(escape(TIM.ICO(16, item.status.icon)))
            __M_writer(' <span class="')
            __M_writer(escape(item.status.css))
            __M_writer('">')
            __M_writer(escape(item.status.label))
            __M_writer('</span>\n            </button>\n')
        else:
            __M_writer('            <button type="button" class="btn btn-default btn-link dropdown-toggle" data-toggle="dropdown">\n                ')
            __M_writer(escape(TIM.ICO(16, item.status.icon)))
            __M_writer(' <span class="')
            __M_writer(escape(item.status.css))
            __M_writer('">')
            __M_writer(escape(item.status.label))
            __M_writer('</span>\n            </button>\n            <ul class="dropdown-menu" role="menu">\n')
            for status in h.AllStatus(item.type):
                if status.id == 'closed-deprecated':
                    __M_writer('                        <li class="divider"></li>\n')
                __M_writer('                    <li><a\n                        class="')
                __M_writer(escape(('', 'pod-status-selected')[status.id==item.status.id]))
                __M_writer('"\n                        href="')
                __M_writer(escape(target_url.format(status_id=status.id)))
                __M_writer('"> ')
                __M_writer(escape(TIM.ICO(16, status.icon)))
                __M_writer(' <span class="')
                __M_writer(escape(status.css))
                __M_writer('">')
                __M_writer(escape(status.label))
                __M_writer('</span></a></li>\n')
            __M_writer('            </ul>\n')
        __M_writer('    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_TREEVIEW_DYNAMIC(context,dom_id,selected_id,get_root_url,get_children_url,mode='link_to_document'):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n')
        __M_writer('    <div id="')
        __M_writer(escape(dom_id))
        __M_writer('">\n        <div id="')
        __M_writer(escape(dom_id))
        __M_writer('-treeview"></div>\n        <input type=\'hidden\' id=\'')
        __M_writer(escape(dom_id))
        __M_writer("-treeview-hidden-field' name='folder_id' value=''/>\n        <script>\n            $(function () {\n                $('#")
        __M_writer(escape(dom_id))
        __M_writer('-treeview\').jstree({\n                    \'plugins\' : [ \'wholerow\', \'types\' ],\n                    "types" : {\n                        "default" : {\n                            "icon" : "')
        __M_writer(escape(TIM.ICO_URL(16, 'places/jstree-folder')))
        __M_writer('"\n                        },\n                        "workspace" : {\n                            "icon" : "')
        __M_writer(escape(TIM.ICO_URL(16, 'places/folder-remote')))
        __M_writer('"\n                        },\n                    },\n                    \'core\' : {\n                        \'error\': function (error) {\n                            console.log(\'Error \' + error.toString())\n                        },\n                        \'data\' : {\n                            \'dataType\': \'json\',\n                            \'contentType\': \'application/json; charset=utf-8\',\n                            \'url\' : function (node) {\n                                if (node.id===\'#\') {\n                                    return \'')
        __M_writer(get_root_url)
        __M_writer("'\n                                } else {\n                                    return '")
        __M_writer(escape(get_children_url))
        __M_writer('\'\n                                }\n                            },\n                            \'data\' : function(node) {\n                                console.log("NODE => "+JSON.stringify(node))\n                                return {\n                                    \'id\' : node.id\n                                };\n                            },\n                            \'success\': function (new_data) {\n                                console.log(\'loaded new menu data\' + new_data)\n                                console.log(new_data);\n\n                                for (var i = new_data[\'d\'].length; i--;) {\n                                    // prepareOrRemoveTreeNode(null, new_data[\'d\'][i], new_data[\'d\'], shouldRemoveNodeDoneCallBack);\n                                }\n                                return new_data;\n                            },\n                        },\n                    }\n                });\n\n')
        if mode=='link_to_document':
            __M_writer("                    $('#")
            __M_writer(escape(dom_id))
            __M_writer('-treeview\').on("select_node.jstree", function (e, data) {\n                        // click event is intercepted, so we fake a click() by getting the href value\n                        // of child link and put it as current document location\n                        url = $(\'#\'+data.selected[0]+\' > a\').attr(\'href\');\n                        location.href = url;\n                    });\n')
        else:              
            __M_writer("                    $('#")
            __M_writer(escape(dom_id))
            __M_writer('-treeview\').on("select_node.jstree", function (e, data) {\n                        // on click, the form hidden field is updated\n')
            __M_writer("                        $('#")
            __M_writer(escape(dom_id))
            __M_writer("-treeview-hidden-field').val(data.selected[0]);\n                    });\n")
        __M_writer("                \n                $('#")
        __M_writer(escape(dom_id))
        __M_writer('-treeview\').on("loaded.jstree", function () {\n                    nodes = $(\'#left-sidebar-treeview .jstree-node\');\n                    console.log("nodes = "+nodes.length);\n                    if (nodes.length<=0) {\n                        $("#left-sidebar-treeview").append( "<p class=\'pod-grey\'>')
        __M_writer(_('There is no content yet.'))
        __M_writer('" );\n                        $("#left-sidebar-treeview").append( "<p><a class=\\"btn btn-success\\" data-toggle=\\"modal\\" role=\\"button\\" href=\\"#add-document-modal-form\\"><i class=\\"fa fa-plus\\"></i> ')
        __M_writer(escape(_('Create a topic')))
        __M_writer('</a></p>" );\n                    }\n                });\n            });\n        </script>\n    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"23": 1, "26": 0, "31": 1, "32": 13, "33": 15, "34": 17, "35": 31, "36": 70, "37": 87, "38": 104, "39": 120, "40": 128, "41": 214, "42": 220, "43": 226, "44": 233, "45": 257, "51": 228, "59": 228, "60": 229, "62": 229, "63": 230, "65": 230, "66": 232, "67": 232, "68": 232, "74": 19, "82": 19, "83": 20, "84": 20, "85": 21, "86": 21, "87": 22, "88": 22, "89": 25, "90": 26, "91": 27, "92": 27, "93": 27, "94": 30, "100": 106, "110": 106, "111": 107, "112": 108, "113": 108, "114": 108, "115": 109, "116": 110, "117": 110, "118": 110, "119": 111, "120": 112, "121": 113, "122": 113, "123": 113, "124": 113, "125": 113, "126": 113, "127": 114, "128": 114, "129": 114, "130": 114, "131": 114, "132": 114, "133": 115, "134": 115, "135": 118, "141": 216, "149": 216, "150": 217, "152": 217, "153": 218, "155": 218, "156": 219, "157": 219, "163": 15, "167": 15, "168": 15, "169": 15, "175": 222, "183": 222, "184": 223, "186": 223, "187": 224, "189": 224, "190": 225, "191": 225, "197": 3, "202": 3, "203": 4, "204": 4, "205": 5, "206": 6, "207": 7, "208": 7, "209": 7, "210": 7, "211": 7, "212": 8, "213": 9, "214": 9, "215": 9, "216": 9, "217": 9, "218": 9, "219": 9, "220": 12, "226": 33, "236": 33, "237": 34, "238": 35, "239": 35, "240": 35, "241": 36, "242": 37, "243": 37, "244": 37, "245": 38, "246": 39, "247": 40, "248": 40, "249": 40, "250": 40, "251": 40, "252": 40, "253": 42, "254": 43, "255": 43, "256": 43, "257": 44, "258": 45, "259": 46, "260": 46, "261": 46, "262": 48, "263": 49, "264": 50, "265": 50, "266": 50, "267": 53, "268": 54, "269": 55, "270": 55, "271": 55, "272": 58, "273": 59, "274": 60, "275": 60, "276": 60, "277": 63, "278": 65, "279": 68, "285": 72, "295": 72, "296": 73, "297": 74, "298": 74, "299": 74, "300": 75, "301": 76, "302": 76, "303": 76, "304": 77, "305": 78, "306": 79, "307": 79, "308": 79, "309": 79, "310": 79, "311": 79, "312": 81, "313": 81, "314": 81, "315": 81, "316": 81, "317": 81, "318": 85, "324": 89, "334": 89, "335": 90, "336": 91, "337": 91, "338": 91, "339": 92, "340": 93, "341": 93, "342": 93, "343": 94, "344": 95, "345": 96, "346": 96, "347": 96, "348": 96, "349": 96, "350": 96, "351": 98, "352": 98, "353": 98, "354": 98, "355": 98, "356": 98, "357": 102, "363": 17, "367": 17, "368": 17, "369": 17, "370": 17, "371": 17, "377": 122, "385": 122, "386": 123, "391": 126, "392": 127, "393": 127, "399": 235, "405": 235, "406": 237, "407": 238, "408": 239, "409": 239, "410": 239, "411": 239, "412": 239, "413": 239, "414": 241, "415": 242, "416": 243, "417": 243, "418": 243, "419": 243, "420": 243, "421": 243, "422": 246, "423": 247, "424": 248, "425": 250, "426": 251, "427": 251, "428": 252, "429": 252, "430": 252, "431": 252, "432": 252, "433": 252, "434": 252, "435": 252, "436": 254, "437": 256, "443": 130, "449": 130, "450": 134, "451": 134, "452": 134, "453": 135, "454": 135, "455": 136, "456": 136, "457": 139, "458": 139, "459": 143, "460": 143, "461": 146, "462": 146, "463": 158, "464": 158, "465": 160, "466": 160, "467": 186, "468": 187, "469": 187, "470": 187, "471": 193, "472": 194, "473": 194, "474": 194, "475": 199, "476": 199, "477": 199, "478": 202, "479": 203, "480": 203, "481": 207, "482": 207, "483": 208, "484": 208, "490": 484}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_widgets.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/user_workspace_widgets.mak"}
__M_END_METADATA
"""
