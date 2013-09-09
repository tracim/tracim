# -*- encoding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 9
_modified_time = 1378722899.890202
_enable_loop = True
_template_filename = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/dashboard.mak'
_template_uri = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/dashboard.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['node_treeview', 'get_icon_class_from_node_type', 'title', 'node_treeview_in_select_field']


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
        root_node_list = context.get('root_node_list', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        current_node = context.get('current_node', UNDEFINED)
        def node_treeview(node_list,indentation=0):
            return render_node_treeview(context._locals(__M_locals),node_list,indentation)
        def node_treeview_in_select_field(node_list,indentation):
            return render_node_treeview_in_select_field(context._locals(__M_locals),node_list,indentation)
        __M_writer = context.writer()
        # SOURCE LINE 1
        __M_writer(u'\n')
        # SOURCE LINE 4
        __M_writer(u'\n\n')
        # SOURCE LINE 31
        __M_writer(u'\n\n')
        # SOURCE LINE 44
        __M_writer(u'\n\n')
        # SOURCE LINE 48
        __M_writer(u'\n\n  <div class="row">\n    <div class="span3">\n      <legend>\n        Documents\n      </legend>\n\n      <!-- Button to trigger modal -->\n      <p>\n        <a href="#addFolderNode" role="button" class="btn" data-toggle="modal">\n          <i class="icon-g-circle-plus"></i> Create document</a>\n      </p>\n      <!-- Modal -->\n      <div id="addFolderNode" class="modal hide" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">\n        <div class="modal-header">\n          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">\xd7</button>\n          <h3 id="myModalLabel">Create a new page</h3>\n        </div>\n        <div class="modal-body">\n          <form id="create_document_form" method="POST" action="')
        # SOURCE LINE 68
        __M_writer(escape(tg.url('/create_document')))
        __M_writer(u'" class="form-horizontal">\n            <div class="control-group">\n              <label class="control-label" for="data_label">Title</label>\n              <div class="controls">\n                <input type="text" id="data_label" name="data_label" placeholder="page title...">\n              </div>\n            </div>\n            <div class="control-group">\n              <label class="control-label" for="parent_id">As child of...</label>\n              <div class="controls">\n                <select id="parent_id" name="parent_id" placeholder="as child of...">\n                  ')
        # SOURCE LINE 79
        __M_writer(escape(node_treeview_in_select_field(root_node_list, 0)))
        __M_writer(u'\n                </select>\n              </div>\n            </div>\n            <div class="control-group">\n              <label class="control-label" for="data_content">Description</label>\n              <div class="controls">\n\n                <textarea id="data_content" name="data_content"></textarea>\n              </div>\n            </div>\n          </form>\n        </div>\n        <div class="modal-footer">\n          <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>\n          <button id="create_document_save_button" class="btn btn-primary">Save changes</button>\n        </div>\n      </div>\n\n      <div>\n        <table class="table table-striped table-hover table-condensed">\n          ')
        # SOURCE LINE 100
        __M_writer(escape(node_treeview(root_node_list)))
        __M_writer(u'\n        </table>\n      </div>\n    </div>\n    <div class="span5">\n      <div class="page-header">\n        <h3>')
        # SOURCE LINE 106
        __M_writer(escape(current_node.data_label))
        __M_writer(u'</h3>\n      </div>\n\n      <div class="btn-group">\n        <button class="btn"><i class="icon-g-edit"></i> Edit</button>\n\n      </div>\n\n      <div class="btn-group">\n        <a class="btn btn-primary" href="#"><i class="icon-g-stats icon-g-white"></i> Status</a>\n        <a class="btn btn-primary dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a>\n        <ul class="dropdown-menu">\n        \n          \n  \n          <li><a class="btn-success" href="#"><i class="icon-g-sun"></i> Open</a></li>\n          <li><a class="btn-warning" href="#"><i class="icon-g-rotation-lock"></i> in Standby</a></li>\n          <li><a class="btn-danger"  href="#"><i class="icon-g-circle-exclamation-mark"></i> Hot</a></li>\n          <li><a class="btn " href="#"><i class="icon-g-ok"></i> Finished</a></li>\n          <li><a class="btn btn-disabled" href="#"><i class="icon-g-ban"></i> Archived</a></li>\n        </ul>\n\n      </div>\n\n      <div class="btn-group">\n        <a class="btn btn-primary" href="#" ><i class="icon-g-circle-plus icon-g-white"></i> Add</a>\n        <a class="btn btn-primary dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a>\n        <ul class="dropdown-menu">\n          <li><a href="#"><i class="icon-g-calendar" ></i> Event</a></li>\n          <li><a href="#"><i class="icon-g-comments"></i> Comment</a></li>\n          <li><a href="#"><i class="icon-g-user"></i> Contact</a></li>\n          <li><a href="#"><i class="icon-g-attach"></i> File</a></li>\n        </ul>\n      </div>\n\n      <div class="btn-group">\n        <button class="btn btn-danger"><i class="icon-g-white icon-g-remove"></i> Delete</button>\n      </div>\n      \n    \n      <div>\n        ')
        # SOURCE LINE 147
        __M_writer(current_node.data_content)
        __M_writer(u'\n      </div>\n    </div>\n    <div class="span4">\n      <div class="tabbable">\n        <ul class="nav nav-tabs">\n            <li class="active">\n              <a href="#events" data-toggle="tab" title="History"><i class="icon-g-calendar"></i></a>\n            </li>\n            <li><a href="#contacts" data-toggle="tab" title="Contacts"><i class="icon-g-user""></i> </a></li>\n            <li><a href="#comments" data-toggle="tab" title="Comments"><i class="icon-g-comments"></i> </a></li>\n            <li><a href="#files" data-toggle="tab" title="Files"><i class="icon-g-attach"></i> </a></li>\n        </ul>\n        <div class="tab-content">\n            <div class="tab-pane active" id="events">\n              <!--p class="text-right" >\n                <button class="text-right btn btn-info " type="button"><i class="icon-g-plus icon-g-white"></i> new event</button>\n              </p-->\n              <table class="table table-striped table-hover table-condensed">\n                <thead>\n                  <tr>\n                    <th>Date</th>\n                    <th>Time</th>\n                    <th>\n                      Event\n                    </th>\n                    <th>\n                      <a href="" title="Add an event"><i class="icon-g-plus"></i></a>\n                    </th>\n                  </tr>\n                </thead>\n')
        # SOURCE LINE 178
        for event in current_node.getEvents():
            # SOURCE LINE 179
            __M_writer(u'                <tr title="Last updated: ')
            __M_writer(escape(event.updated_at))
            __M_writer(u'">\n                   <td>')
            # SOURCE LINE 180
            __M_writer(escape(event.getFormattedDate(event.data_datetime)))
            __M_writer(u'</td>\n                   <td>')
            # SOURCE LINE 181
            __M_writer(escape(event.getFormattedTime(event.data_datetime)))
            __M_writer(u'</td>\n                   <td>')
            # SOURCE LINE 182
            __M_writer(escape(event.data_label))
            __M_writer(u'</td>\n                   <td>\n                     <a href=""><i class="icon-g-edit"></i></a>\n                   </td>\n                </tr>\n')
        # SOURCE LINE 188
        __M_writer(u'              </table>\n            </div>\n            <div class="tab-pane" id="contacts">\n')
        # SOURCE LINE 191
        for contact in current_node.getContacts():
            # SOURCE LINE 192
            __M_writer(u'                <div class="well">\n                  <legend class="text-info">')
            # SOURCE LINE 193
            __M_writer(escape(contact.data_label))
            __M_writer(u'</legend>\n                  <div>')
            # SOURCE LINE 194
            __M_writer(contact.data_content)
            __M_writer(u'</div>\n                </div>\n')
        # SOURCE LINE 197
        __M_writer(u'            </div>\n            <div class="tab-pane" id="comments">')
        # SOURCE LINE 198
        __M_writer(current_node.data_content)
        __M_writer(u'</div>\n            <div class="tab-pane" id="files">Files</div>\n        </div>\n      </div>\n    </div>\n  </div>\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_node_treeview(context,node_list,indentation=0):
    __M_caller = context.caller_stack._push_frame()
    try:
        def node_treeview(node_list,indentation=0):
            return render_node_treeview(context,node_list,indentation)
        len = context.get('len', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 6
        __M_writer(u'\n')
        # SOURCE LINE 7
        if len(node_list)>0:
            # SOURCE LINE 8
            __M_writer(u'    <!--ul style="list-style:none; margin-left: ')
            __M_writer(escape((indentation+1)*0.5))
            __M_writer(u'em;"-->\n')
            # SOURCE LINE 9
            for node in node_list:
                # SOURCE LINE 10
                __M_writer(u'      <tr title="Last updated: ')
                __M_writer(escape(node.updated_at))
                __M_writer(u'">\n        <td style="padding-left: ')
                # SOURCE LINE 11
                __M_writer(escape((indentation+1)*0.5))
                __M_writer(u'em;">\n          <a href="?node=')
                # SOURCE LINE 12
                __M_writer(escape(node.node_id))
                __M_writer(u'" title="')
                __M_writer(escape(node.data_label))
                __M_writer(u'">\n            <i class=\'')
                # SOURCE LINE 13
                __M_writer(escape(node.getIconClass()))
                __M_writer(u"'></i>\n")
                # SOURCE LINE 14
                if len(node.data_label)<=15:
                    # SOURCE LINE 15
                    __M_writer(u'              ')
                    __M_writer(escape(node.data_label))
                    __M_writer(u'\n')
                    # SOURCE LINE 16
                else:
                    # SOURCE LINE 17
                    __M_writer(u'              ')
                    __M_writer(escape(node.data_label[0:15]))
                    __M_writer(u'...\n')
                # SOURCE LINE 19
                __M_writer(u'          </a>\n        </td>\n        <td class="text-right">\n          <a href="')
                # SOURCE LINE 22
                __M_writer(escape(tg.url('/move_node_upper?node_id=%i'%(node.node_id))))
                __M_writer(u'" title="Move up"><i class=" icon-g-up-arrow"></i></a>\n          <a href="')
                # SOURCE LINE 23
                __M_writer(escape(tg.url('/move_node_lower?node_id=%i'%(node.node_id))))
                __M_writer(u'" title="Move down"><i class=" icon-g-down-arrow"></i></a>\n          <a href="" title="Edit"><i class="icon-g-edit"></i></a>\n        </td>\n      </tr>\n      ')
                # SOURCE LINE 27
                __M_writer(escape(node_treeview(node.getChildren(), indentation+1)))
                __M_writer(u'\n')
            # SOURCE LINE 29
            __M_writer(u'    <!--/ul-->\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_get_icon_class_from_node_type(context,node_type):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        # SOURCE LINE 2
        __M_writer(u'\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        # SOURCE LINE 46
        __M_writer(u'\nLearning TurboGears 2.3: Quick guide to the Quickstart pages.\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_node_treeview_in_select_field(context,node_list,indentation):
    __M_caller = context.caller_stack._push_frame()
    try:
        def node_treeview_in_select_field(node_list,indentation):
            return render_node_treeview_in_select_field(context,node_list,indentation)
        len = context.get('len', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 33
        __M_writer(u'\n')
        # SOURCE LINE 34
        if len(node_list)>0:
            # SOURCE LINE 35
            if indentation==0:
                # SOURCE LINE 36
                __M_writer(u'        <option style="margin-left: ')
                __M_writer(escape(0.5*indentation))
                __M_writer(u'em; color: #CCC;" value="0">no parent...</option>\n')
            # SOURCE LINE 38
            for node in node_list:
                # SOURCE LINE 39
                __M_writer(u'        <option style="margin-left: ')
                __M_writer(escape(0.5*indentation))
                __M_writer(u'em;" value="')
                __M_writer(escape(node.node_id))
                __M_writer(u'">')
                __M_writer(escape(node.data_label))
                __M_writer(u'</option>\n        ')
                # SOURCE LINE 40
                __M_writer(escape(node_treeview_in_select_field(node.getChildren(), indentation+1)))
                __M_writer(u'\n')
            # SOURCE LINE 42
            __M_writer(u'      </ul>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


