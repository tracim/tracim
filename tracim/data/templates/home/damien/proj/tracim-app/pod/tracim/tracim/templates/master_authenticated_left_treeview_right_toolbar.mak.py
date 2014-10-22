# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984364.224995
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_authenticated_left_treeview_right_toolbar.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_authenticated_left_treeview_right_toolbar.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['REQUIRED_DIALOGS', 'content_wrapper', 'SIDEBAR_RIGHT_CONTENT', 'SIDEBAR_LEFT_CONTENT', 'FOOTER_CONTENT_LIKE_SCRIPTS_AND_CSS']


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
        __M_writer = context.writer()
        __M_writer('\n')
        __M_writer('\n\n')
        __M_writer('\n')
        __M_writer('\n')
        __M_writer('\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_REQUIRED_DIALOGS(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_content_wrapper(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        self = context.get('self', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <div class="container-fluid">\n        <div class="row-fluid">\n        \n')
        __M_writer('            <div id="sidebar-left" class="fixed-width-sidebar col-sm-2 sidebar" >\n                <div class="btn-group" style="position: absolute; right: 2px; top: 4px; ">\n                    <button id="toggle-left-sidebar-width" type="button" class="btn btn-link"><i class="fa fa-angle-double-right"></i></button>\n                </div>\n                ')
        __M_writer(escape(self.SIDEBAR_LEFT_CONTENT()))
        __M_writer('\n            </div>\n')
        __M_writer('\n')
        __M_writer('            <div id="sidebar-right" class="col-sm-1 col-md-1 col-sm-offset-11 sidebar" style="background-color: #FFF;">\n                ')
        __M_writer(escape(self.SIDEBAR_RIGHT_CONTENT()))
        __M_writer('\n            </div> <!-- # End of side bar right -->\n')
        __M_writer('            \n        <div>\n            ')
        __M_writer(escape(TIM.FLASH_MSG('col-sm-9 col-sm-offset-2')))
        __M_writer('\n            \n            <div class="row">\n                <div class="col-sm-9 col-sm-offset-2 main">\n')
        __M_writer('                    ')
        __M_writer(escape(self.body()))
        __M_writer('\n')
        __M_writer('                </div>\n            </div>\n        </div>\n    </div>\n    ')
        __M_writer(escape(self.REQUIRED_DIALOGS()))
        __M_writer('\n    \n')
        __M_writer('    <script src="')
        __M_writer(escape(tg.url('/assets/js/jquery.min.js')))
        __M_writer('"></script>\n    <!-- IE10 viewport hack for Surface/desktop Windows 8 bug -->\n    <script src="')
        __M_writer(escape(tg.url('/assets/js/ie10-viewport-bug-workaround.js')))
        __M_writer('"></script>\n    <script>\n        $(function () {\n            $(\'#toggle-left-sidebar-width\').click( function() {\n              sidebar = $(\'#sidebar-left\');\n              buttonIcon = $(\'> i\', this);\n              if (sidebar.hasClass(\'fixed-width-sidebar\')) {\n                sidebar.removeClass(\'fixed-width-sidebar\')\n                sidebar.removeClass(\'col-sm-2\');\n                \n                buttonIcon.removeClass(\'fa-angle-double-right\');\n                buttonIcon.addClass(\'fa-angle-double-left\');\n              } else {\n                sidebar.addClass(\'fixed-width-sidebar\')\n                sidebar.addClass(\'col-sm-2\');\n                buttonIcon.removeClass(\'fa-angle-double-left\');\n                buttonIcon.addClass(\'fa-angle-double-right\');\n              }\n            });\n\n            $(\'#current-page-breadcrumb-toggle-button\').click( function() {\n              $(\'#current-page-breadcrumb\').toggle();\n            });\n        });\n    </script>\n    <!-- TinyMCE ================================================== -->\n    <script src="')
        __M_writer(escape(tg.url('/assets/tinymce/js/tinymce/tinymce.min.js')))
        __M_writer('"></script>\n    <script>\n      tinymce.init({\n          menubar:false,\n          statusbar:true,\n          plugins: [ "table", "image", "charmap", "autolink" ],\n\n          skin : \'custom\',\n          selector:\'.pod-rich-textarea\',\n          toolbar: [\n              "undo redo | bold italic underline strikethrough | bullist numlist outdent indent | table | charmap | styleselect | alignleft aligncenter alignright",\n          ]\n      });\n    </script>\n    \n    <!-- JSTree ================================================== -->\n    <link rel="stylesheet" href="')
        __M_writer(escape(tg.url('/assets/jstree/themes/default/style.min.css')))
        __M_writer('" />\n    <script src="')
        __M_writer(escape(tg.url('/assets/jstree/jstree.min.js')))
        __M_writer('"></script>\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_SIDEBAR_RIGHT_CONTENT(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_SIDEBAR_LEFT_CONTENT(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_FOOTER_CONTENT_LIKE_SCRIPTS_AND_CSS(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"23": 2, "29": 0, "34": 1, "35": 2, "36": 4, "37": 5, "38": 6, "39": 7, "40": 94, "46": 6, "55": 9, "62": 9, "63": 14, "64": 18, "65": 18, "66": 21, "67": 23, "68": 24, "69": 24, "70": 27, "71": 29, "72": 29, "73": 34, "74": 34, "75": 34, "76": 36, "77": 40, "78": 40, "79": 47, "80": 47, "81": 47, "82": 49, "83": 49, "84": 75, "85": 75, "86": 91, "87": 91, "88": 92, "89": 92, "95": 5, "104": 4, "113": 7, "122": 113}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_authenticated_left_treeview_right_toolbar.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_authenticated_left_treeview_right_toolbar.mak"}
__M_END_METADATA
"""
