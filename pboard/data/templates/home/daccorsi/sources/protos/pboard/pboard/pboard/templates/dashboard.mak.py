# -*- encoding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 9
_modified_time = 1378917566.913937
_enable_loop = True
_template_filename = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/dashboard.mak'
_template_uri = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/dashboard.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['node_treeview', 'title', 'node_treeview_in_select_field', 'node_treeview_for_set_parent_menu']


def _mako_get_namespace(context, name):
    try:
        return context.namespaces[(__name__, name)]
    except KeyError:
        _mako_generate_namespaces(context)
        return context.namespaces[(__name__, name)]
def _mako_generate_namespaces(context):
    # SOURCE LINE 2
    ns = runtime.TemplateNamespace(u'POD', context._clean_inheritance_tokens(), templateuri=u'pboard.templates.pod', callables=None,  calling_uri=_template_uri)
    context.namespaces[(__name__, u'POD')] = ns

def _mako_inherit(template, context):
    _mako_generate_namespaces(context)
    return runtime._inherit_from(context, u'local:templates.master', _template_uri)
def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        def node_treeview_for_set_parent_menu(node_id,node_list,indentation=-1):
            return render_node_treeview_for_set_parent_menu(context._locals(__M_locals),node_id,node_list,indentation)
        root_node_list = context.get('root_node_list', UNDEFINED)
        node_status_list = context.get('node_status_list', UNDEFINED)
        current_node = context.get('current_node', UNDEFINED)
        def node_treeview(node_list,indentation=-1):
            return render_node_treeview(context._locals(__M_locals),node_list,indentation)
        tg = context.get('tg', UNDEFINED)
        POD = _mako_get_namespace(context, 'POD')
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 1
        __M_writer(u'\n')
        # SOURCE LINE 2
        __M_writer(u'\n\n\n')
        # SOURCE LINE 22
        __M_writer(u'\n\n')
        # SOURCE LINE 56
        __M_writer(u'\n\n')
        # SOURCE LINE 72
        __M_writer(u'\n\n')
        # SOURCE LINE 76
        __M_writer(u'\n\n  <div class="row">\n    <div class="span3">\n      <div class="btn-group">\n        <button class="btn">')
        # SOURCE LINE 81
        __M_writer(escape(_('Documents')))
        __M_writer(u'</button>\n        <button class="btn" title="')
        # SOURCE LINE 82
        __M_writer(escape(_('Show current filtering state')))
        __M_writer(u'"><i class="  icon-g-eye-open"></i></button>\n        \n        <a class="btn dropdown-toggle" data-toggle="dropdown" href="#" title=\'')
        # SOURCE LINE 84
        __M_writer(escape(_('Adjust filtering')))
        __M_writer(u'\'><i class=" icon-g-adjust"></i></a>\n                <ul class="dropdown-menu">\n')
        # SOURCE LINE 86
        for node_status in node_status_list:
            # SOURCE LINE 87
            __M_writer(u'            <li>\n              <a class="')
            # SOURCE LINE 88
            __M_writer(escape(node_status.css))
            __M_writer(u'" href="')
            __M_writer(escape(tg.url('/edit_status?node_id=%i&node_status=%s'%(current_node.node_id, node_status.status_id))))
            __M_writer(u'">\n                <i class="')
            # SOURCE LINE 89
            __M_writer(escape(node_status.icon_id))
            __M_writer(u'"></i> ')
            __M_writer(escape(node_status.label))
            __M_writer(u'\n              </a>\n            </li>\n')
        # SOURCE LINE 93
        __M_writer(u'        </ul>\n      </div>\n      <p></p>\n      <div>\n        ')
        # SOURCE LINE 97
        __M_writer(escape(node_treeview(root_node_list)))
        __M_writer(u'\n      </div>\n    </div>\n    <div class="span9">\n        \n        \n        \n        <form style=\'display: none;\' id="current-document-title-edit-form" method=\'post\' action=\'')
        # SOURCE LINE 104
        __M_writer(escape(tg.url('/edit_label')))
        __M_writer(u'\'>\n          <div class="input-prepend input-append">\n            <input type=\'hidden\' name=\'node_id\' value=\'')
        # SOURCE LINE 106
        __M_writer(escape(current_node.node_id))
        __M_writer(u"'/>\n            ")
        # SOURCE LINE 107
        __M_writer(escape(POD.CancelButton('current-document-title-edit-cancel-button')))
        __M_writer(u"\n            <input type='text' name='data_label' value='")
        # SOURCE LINE 108
        __M_writer(escape(current_node.data_label))
        __M_writer(u'\' class="span2" />\n            ')
        # SOURCE LINE 109
        __M_writer(escape(POD.SaveButton('current-document-title-save-cancel-button')))
        __M_writer(u'\n          </div>\n        </form>\n\n\n      <div class="btn-group">\n        <button class="btn">Status</button>\n        <a class="btn ')
        # SOURCE LINE 116
        __M_writer(escape(current_node.getStatus().css))
        __M_writer(u'" href="#"><i class="')
        __M_writer(escape(current_node.getStatus().icon))
        __M_writer(u'"></i> ')
        __M_writer(escape(current_node.getStatus().getLabel()))
        __M_writer(u'</a>\n        <a class="btn ')
        # SOURCE LINE 117
        __M_writer(escape(current_node.getStatus().css))
        __M_writer(u' dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a>\n        <ul class="dropdown-menu">\n')
        # SOURCE LINE 119
        for node_status in node_status_list:
            # SOURCE LINE 120
            __M_writer(u'            <li>\n              <a class="')
            # SOURCE LINE 121
            __M_writer(escape(node_status.css))
            __M_writer(u'" href="')
            __M_writer(escape(tg.url('/edit_status?node_id=%i&node_status=%s'%(current_node.node_id, node_status.status_id))))
            __M_writer(u'">\n                <i class="')
            # SOURCE LINE 122
            __M_writer(escape(node_status.icon_id))
            __M_writer(u'"></i> ')
            __M_writer(escape(node_status.label))
            __M_writer(u'\n              </a>\n            </li>\n')
        # SOURCE LINE 126
        __M_writer(u'        </ul>\n      </div>\n      <div class="btn-group">\n        ')
        # SOURCE LINE 129
        __M_writer(escape(POD.EditButton('current-document-content-edit-button', True)))
        __M_writer(u'\n        <a class="btn" href="#" data-toggle="dropdown"><i class="icon-g-move"></i> ')
        # SOURCE LINE 130
        __M_writer(escape(_('Move to')))
        __M_writer(u' <span class="caret"></span></a>\n        <ul class="dropdown-menu">\n          ')
        # SOURCE LINE 132
        __M_writer(escape(node_treeview_for_set_parent_menu(current_node.node_id, root_node_list)))
        __M_writer(u"\n        </ul>\n\n\n        <a href='")
        # SOURCE LINE 136
        __M_writer(escape(tg.url('/force_delete_node?node_id=%i'%(current_node.node_id))))
        __M_writer(u'\' id=\'current-document-force-delete-button\' class="btn" onclick="return confirm(\'')
        __M_writer(escape(_('Delete current document?')))
        __M_writer(u'\');"><i class="icon-g-remove"></i> ')
        __M_writer(escape(_('Delete')))
        __M_writer(u'</a>\n      </div>\n      \n            <!--</div> PAGE HEADER -->\n      <h3 id="current-document-title">')
        # SOURCE LINE 140
        __M_writer(escape(current_node.data_label))
        __M_writer(u'</h3>\n</div>\n      <div class="span5">\n      \n      <p>\n        <div id=\'current-document-content\' class="">\n          ')
        # SOURCE LINE 146
        __M_writer(current_node.data_content)
        __M_writer(u'\n        </div>\n        <form style=\'display: none;\' id="current-document-content-edit-form" method=\'post\' action=\'')
        # SOURCE LINE 148
        __M_writer(escape(tg.url('/edit_content')))
        __M_writer(u"'>\n          <input type='hidden' name='node_id' value='")
        # SOURCE LINE 149
        __M_writer(escape(current_node.node_id))
        __M_writer(u'\'/>\n          <textarea id="current_node_textarea" name=\'data_content\' spellcheck="false" wrap="off" autofocus placeholder="Enter something ...">\n            ')
        # SOURCE LINE 151
        __M_writer(current_node.data_content)
        __M_writer(u'\n          </textarea>\n          ')
        # SOURCE LINE 153
        __M_writer(escape(POD.CancelButton('current-document-content-edit-cancel-button', True)))
        __M_writer(u'\n          ')
        # SOURCE LINE 154
        __M_writer(escape(POD.SaveButton('current-document-content-edit-save-button', True)))
        __M_writer(u'\n        </form>\n      </p>\n    </div>\n    <div class="span4">\n      <div class="tabbable">\n        <ul class="nav nav-tabs">\n            <li class="active">\n              <a href="#events" data-toggle="tab" title="History"><i class="icon-g-history"></i></a>\n            </li>\n            <li><a href="#contacts" data-toggle="tab" title="Contacts"><i class="icon-g-phone""></i> </a></li>\n            <li><a href="#comments" data-toggle="tab" title="Comments"><i class="icon-g-comments"></i> </a></li>\n            <li><a href="#files" data-toggle="tab" title="Files"><i class="icon-g-attach"></i> </a></li>\n            <li><a href="#contacts" data-toggle="tab" title="Users"><i class="icon-g-user""></i> </a></li>\n        </ul>\n        <div class="tab-content">\n            <div class="tab-pane active" id="events">\n\n')
        # SOURCE LINE 172
        __M_writer(escape(POD.AddButton('current-document-add-event-button', True, _(' Add event'))))
        __M_writer(u"\n<form style='display: none;' id='current-document-add-event-form' action='")
        # SOURCE LINE 173
        __M_writer(escape(tg.url('/api/create_event')))
        __M_writer(u'\' method=\'post\' class="well">\n  <input type="hidden" name=\'parent_id\' value=\'')
        # SOURCE LINE 174
        __M_writer(escape(current_node.node_id))
        __M_writer(u'\'/>\n  <fieldset>\n    <legend>Add an event</legend>\n    <label>\n      <input type="text" name=\'data_label\' placeholder="Event"/>\n    </label>\n    <label>\n      <div class="datetime-picker-input-div input-append date">\n        <input name=\'data_datetime\' data-format="dd/MM/yyyy hh:mm" type="text" placeholder="date and time"/>\n        <span class="add-on"><i data-time-icon="icon-g-clock" data-date-icon="icon-g-calendar"></i></span>\n      </div>\n    </label>\n    <label class="checkbox">\n      <input disabled name=\'add_reminder\' type="checkbox"> add a reminder\n    </label>\n    <label>\n      <div class="datetime-picker-input-div input-append date">\n        <input disabled name=\'data_reminder_datetime\' data-format="dd/MM/yyyy hh:mm" type="text" placeholder="date and time"/>\n        <span class="add-on"><i data-time-icon="icon-g-clock" data-date-icon="icon-g-calendar"></i></span>\n      </div>\n    </label>\n\n    ')
        # SOURCE LINE 196
        __M_writer(escape(POD.CancelButton('current-document-add-event-cancel-button', True)))
        __M_writer(u'\n    ')
        # SOURCE LINE 197
        __M_writer(escape(POD.SaveButton('current-document-add-event-save-button', True)))
        __M_writer(u'\n  </fieldset>\n</form>\n\n              <table class="table table-striped table-hover table-condensed">\n                <thead>\n                  <tr>\n                    <th>Date</th>\n                    <th>Time</th>\n                    <th>\n                      Event\n                    </th>\n                    <th>\n                      <a href="" title="Add an event"><i class="icon-g-plus"></i></a>\n                    </th>\n                  </tr>\n                </thead>\n')
        # SOURCE LINE 214
        for event in current_node.getEvents():
            # SOURCE LINE 215
            __M_writer(u'                <tr title="Last updated: ')
            __M_writer(escape(event.updated_at))
            __M_writer(u'">\n                   <td>')
            # SOURCE LINE 216
            __M_writer(escape(event.getFormattedDate(event.data_datetime)))
            __M_writer(u'</td>\n                   <td>')
            # SOURCE LINE 217
            __M_writer(escape(event.getFormattedTime(event.data_datetime)))
            __M_writer(u'</td>\n                   <td>')
            # SOURCE LINE 218
            __M_writer(escape(event.data_label))
            __M_writer(u'</td>\n                   <td>\n                     <a href=""><i class="icon-g-edit"></i></a>\n                   </td>\n                </tr>\n')
        # SOURCE LINE 224
        __M_writer(u'              </table>\n            </div>\n            <div class="tab-pane" id="contacts">\n')
        # SOURCE LINE 227
        for contact in current_node.getContacts():
            # SOURCE LINE 228
            __M_writer(u'                <div class="well">\n                  <legend class="text-info">')
            # SOURCE LINE 229
            __M_writer(escape(contact.data_label))
            __M_writer(u'</legend>\n                  <div>')
            # SOURCE LINE 230
            __M_writer(contact.data_content)
            __M_writer(u'</div>\n                </div>\n')
        # SOURCE LINE 233
        __M_writer(u'            </div>\n            <div class="tab-pane" id="comments">')
        # SOURCE LINE 234
        __M_writer(current_node.data_content)
        __M_writer(u'</div>\n            <div class="tab-pane" id="files">Files</div>\n        </div>\n      </div>\n    </div>\n  </div>\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_node_treeview(context,node_list,indentation=-1):
    __M_caller = context.caller_stack._push_frame()
    try:
        def node_treeview(node_list,indentation=-1):
            return render_node_treeview(context,node_list,indentation)
        len = context.get('len', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 24
        __M_writer(u'\n')
        # SOURCE LINE 25
        if indentation==-1:
            # SOURCE LINE 26
            __M_writer(u'    <div class="pod-toolbar-parent" style="padding-left: 0.5em; position: relative;">\n      <a href="?node=0" title="')
            # SOURCE LINE 27
            __M_writer(escape(_('Root')))
            __M_writer(u'">\n        <i class=\'icon-g-folder-open\'></i>\n        ')
            # SOURCE LINE 29
            __M_writer(escape(_('Root')))
            __M_writer(u'\n      </a>\n      <div class="pod-toolbar">\n        <a href="')
            # SOURCE LINE 32
            __M_writer(escape(tg.url('/create_document?parent_id=0')))
            __M_writer(u'" title="')
            __M_writer(escape(_('Add child document')))
            __M_writer(u'"><i class="icon-g-circle-plus"></i></a>\n      </div>\n    </div>\n    ')
            # SOURCE LINE 35
            __M_writer(escape(node_treeview(node_list, 0)))
            __M_writer(u'\n')
            # SOURCE LINE 36
        else:
            # SOURCE LINE 37
            if len(node_list)>0:
                # SOURCE LINE 38
                for node in node_list:
                    # SOURCE LINE 39
                    __M_writer(u'        <div class="pod-toolbar-parent" style="padding-left: ')
                    __M_writer(escape((indentation+2)*0.5))
                    __M_writer(u'em; position: relative;">\n          <a href="?node=')
                    # SOURCE LINE 40
                    __M_writer(escape(node.node_id))
                    __M_writer(u'" title="')
                    __M_writer(escape(node.data_label))
                    __M_writer(u'">\n            <i class=\'')
                    # SOURCE LINE 41
                    __M_writer(escape(node.getIconClass()))
                    __M_writer(u"'></i> ")
                    __M_writer(escape(node.getTruncatedLabel(32-0.8*(indentation+1))))
                    __M_writer(u'\n          </a>\n          <div class="pod-toolbar">\n            <a href="')
                    # SOURCE LINE 44
                    __M_writer(escape(tg.url('/move_node_upper?node_id=%i'%(node.node_id))))
                    __M_writer(u'" title="')
                    __M_writer(escape(_('Move up')))
                    __M_writer(u'"><i class="icon-g-up-arrow"></i></a>\n            <a href="')
                    # SOURCE LINE 45
                    __M_writer(escape(tg.url('/move_node_lower?node_id=%i'%(node.node_id))))
                    __M_writer(u'" title="')
                    __M_writer(escape(_('Move down')))
                    __M_writer(u'"><i class="icon-g-down-arrow"></i></a>\n            <a href="')
                    # SOURCE LINE 46
                    __M_writer(escape(tg.url('/create_document?parent_id=%i'%(node.node_id))))
                    __M_writer(u'" title="')
                    __M_writer(escape(_('Add child document')))
                    __M_writer(u'"><i class="icon-g-circle-plus"></i></a>\n          </div>\n          <div class="pod-status ')
                    # SOURCE LINE 48
                    __M_writer(escape(node.getStatus().css))
                    __M_writer(u'" title=\'')
                    __M_writer(escape(node.getStatus().label))
                    __M_writer(u"'>\n             <i class='")
                    # SOURCE LINE 49
                    __M_writer(escape(node.getStatus().icon))
                    __M_writer(u"'></i>\n          </div>\n        </div>\n        ")
                    # SOURCE LINE 52
                    __M_writer(escape(node_treeview(node.getChildren(), indentation+1)))
                    __M_writer(u'\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        current_node = context.get('current_node', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 74
        __M_writer(u'\nPOD :: ')
        # SOURCE LINE 75
        __M_writer(escape(current_node.getTruncatedLabel(40)))
        __M_writer(u' [')
        __M_writer(escape(current_node.getStatus().label))
        __M_writer(u']\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_node_treeview_in_select_field(context,node_list,indentation,selected_id=0):
    __M_caller = context.caller_stack._push_frame()
    try:
        def node_treeview_in_select_field(node_list,indentation,selected_id=0):
            return render_node_treeview_in_select_field(context,node_list,indentation,selected_id)
        len = context.get('len', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 58
        __M_writer(u'\n')
        # SOURCE LINE 59
        if len(node_list)>0:
            # SOURCE LINE 60
            if indentation==0:
                # SOURCE LINE 61
                __M_writer(u'        <option style="margin-left: ')
                __M_writer(escape(0.5*indentation))
                __M_writer(u'em; color: #CCC;" value="0">no parent...</option>\n')
            # SOURCE LINE 63
            for node in node_list:
                # SOURCE LINE 64
                if selected_id!=node.node_id:
                    # SOURCE LINE 65
                    __M_writer(u'          <option style="margin-left: ')
                    __M_writer(escape(0.5*indentation))
                    __M_writer(u'em;" value="')
                    __M_writer(escape(node.node_id))
                    __M_writer(u'">')
                    __M_writer(escape(node.data_label))
                    __M_writer(u'</option>\n')
                    # SOURCE LINE 66
                else:
                    # SOURCE LINE 67
                    __M_writer(u'          <option style="margin-left: ')
                    __M_writer(escape(0.5*indentation))
                    __M_writer(u'em;" value="')
                    __M_writer(escape(node.node_id))
                    __M_writer(u'" selected>')
                    __M_writer(escape(node.data_label))
                    __M_writer(u'</option>\n')
                # SOURCE LINE 69
                __M_writer(u'        ')
                __M_writer(escape(node_treeview_in_select_field(node.getChildren(), indentation+1, selected_id)))
                __M_writer(u'\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_node_treeview_for_set_parent_menu(context,node_id,node_list,indentation=-1):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        current_node = context.get('current_node', UNDEFINED)
        len = context.get('len', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        def node_treeview_for_set_parent_menu(node_id,node_list,indentation=-1):
            return render_node_treeview_for_set_parent_menu(context,node_id,node_list,indentation)
        __M_writer = context.writer()
        # SOURCE LINE 5
        __M_writer(u'\n')
        # SOURCE LINE 6
        if indentation==-1:
            # SOURCE LINE 7
            __M_writer(u'    <li><a href="')
            __M_writer(escape(tg.url('/api/set_parent_node?node_id=%i&new_parent_id=0'%(current_node.node_id))))
            __M_writer(u'">')
            __M_writer(escape(_('Root')))
            __M_writer(u'</a>\n      ')
            # SOURCE LINE 8
            __M_writer(escape(node_treeview_for_set_parent_menu(node_id, node_list, 0)))
            __M_writer(u'\n    </li>\n')
            # SOURCE LINE 10
        else:
            # SOURCE LINE 11
            if len(node_list)>0:
                # SOURCE LINE 12
                __M_writer(u'      <ul>\n')
                # SOURCE LINE 13
                for new_parent_node in node_list:
                    # SOURCE LINE 14
                    __M_writer(u'        <li>\n          <a href="')
                    # SOURCE LINE 15
                    __M_writer(escape(tg.url('/api/set_parent_node?node_id=%i&new_parent_id=%i'%(node_id, new_parent_node.node_id))))
                    __M_writer(u'">')
                    __M_writer(escape(new_parent_node.getTruncatedLabel(40-indentation*2)))
                    __M_writer(u'</a>\n          ')
                    # SOURCE LINE 16
                    __M_writer(escape(node_treeview_for_set_parent_menu(node_id, new_parent_node.getChildren(), indentation+1)))
                    __M_writer(u'\n        </li>\n')
                # SOURCE LINE 19
                __M_writer(u'      </ul>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


