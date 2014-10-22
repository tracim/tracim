# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984364.273212
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_authenticated.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_authenticated.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['footer', 'body_class', 'meta', 'title', 'main_menu', 'content_wrapper']


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
        tg = context.get('tg', UNDEFINED)
        self = context.get('self', UNDEFINED)
        h = context.get('h', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\r\n<!DOCTYPE html>\r\n<html>\r\n    <head>\r\n\t    ')
        __M_writer(escape(self.meta()))
        __M_writer('\r\n        <meta charset="utf-8">\r\n\t    <title>')
        __M_writer(escape(self.title()))
        __M_writer('</title>\r\n        <meta http-equiv="X-UA-Compatible" content="IE=edge">\r\n        <meta name="viewport" content="width=device-width, initial-scale=1">\r\n        <meta name="description" content="">\r\n        <meta name="author" content="">\r\n        <link rel="icon" href="../../favicon.ico">\r\n        <link href="')
        __M_writer(escape(tg.url('/assets/css/bootstrap.min.css')))
        __M_writer('" rel="stylesheet">\r\n        <link href="')
        __M_writer(escape(tg.url('/assets/css/dashboard.css')))
        __M_writer('" rel="stylesheet">\r\n        <link href="')
        __M_writer(escape(tg.url('/assets/font-awesome-4.2.0/css/font-awesome.css')))
        __M_writer('" rel="stylesheet">\r\n    </head>\r\n\r\n    <body class="')
        __M_writer(escape(self.body_class()))
        __M_writer('">\r\n        <script src="')
        __M_writer(escape(tg.url('/assets/js/jquery.min.js')))
        __M_writer('"></script>\r\n\r\n        <div class="container-fluid">\r\n            ')
        __M_writer(escape(self.main_menu()))
        __M_writer('\r\n            ')
        __M_writer(escape(self.content_wrapper()))
        __M_writer('\r\n            ')
        __M_writer(escape(self.footer()))
        __M_writer('\r\n        </div>\r\n\r\n        <script src="')
        __M_writer(escape(tg.url('/assets/js/bootstrap.min.js')))
        __M_writer('"></script>\r\n        ')
        __M_writer(h.tracker_js())
        __M_writer('\r\n    </body>\r\n\r\n')
        __M_writer('\r\n\r\n')
        __M_writer('\r\n\r\n')
        __M_writer('\r\n\r\n')
        __M_writer('\r\n\r\n')
        __M_writer('\r\n\r\n\r\n')
        __M_writer('\r\n\r\n</html>\r\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_footer(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\r\n    <div class="pod-footer footer hidden-tablet hidden-phone text-center">\r\n        <p>\r\n            <a href="http://trac.im">')
        __M_writer(escape(_('Create your own email-ready collaborative workspace on trac.im')))
        __M_writer('</a> &mdash;\r\n            copyright &copy; 2013 - ')
        __M_writer(escape(h.current_year()))
        __M_writer(' tracim project.\r\n        </p>\r\n    </div>\r\n    \r\n    <script type="text/javascript">\r\n        $(function () {\r\n            $("[rel=\'tooltip\']").tooltip();\r\n        });\r\n    </script>\r\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_body_class(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_meta(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        response = context.get('response', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\r\n    <meta charset="')
        __M_writer(escape(response.charset))
        __M_writer('" />\r\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\r\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        __M_writer('  ')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_main_menu(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        h = context.get('h', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        fake_api = context.get('fake_api', UNDEFINED)
        request = context.get('request', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\r\n    <div class="navbar navbar-fixed-top" role="navigation">\r\n        <div class="container-fluid">\r\n            <div class="navbar-header">\r\n                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target=".navbar-collapse">\r\n                    <span class="sr-only">Toggle navigation</span>\r\n                    <span class="icon-bar"></span>\r\n                    <span class="icon-bar"></span>\r\n                    <span class="icon-bar"></span>\r\n                </button>\r\n                <a class="navbar-brand" href="')
        __M_writer(escape(tg.url('/')))
        __M_writer('">\r\n')
        __M_writer('                  <img src="')
        __M_writer(escape(tg.url('/assets/img/logo.png')))
        __M_writer('" class="pull-left" style="height: 48px; margin: -13px 0.5em 0 -13px;"/>\r\n                </a>\r\n            </div>\r\n            <div class="navbar-collapse collapse">\r\n')
        if request.identity:
            __M_writer('                    <ul class="nav navbar-nav navbar-left">\r\n                        <li><a href="')
            __M_writer(escape(tg.url('/dashboard')))
            __M_writer('">')
            __M_writer(escape(TIM.ICO(16, 'places/user-desktop')))
            __M_writer(' ')
            __M_writer(escape(_('Dashboard')))
            __M_writer('</a></li>\r\n                        <li><a href="')
            __M_writer(escape(tg.url('/workspaces')))
            __M_writer('">')
            __M_writer(escape(TIM.ICO(16, 'places/folder-remote')))
            __M_writer(' ')
            __M_writer(escape(_('Workspace')))
            __M_writer('</a></li>\r\n\r\n')
            if fake_api.current_user.profile.id>=2:
                __M_writer('                            <li class="dropdown">\r\n                              <a href="#" class="dropdown-toggle" data-toggle="dropdown">')
                __M_writer(escape(TIM.ICO(16, 'categories/preferences-system')))
                __M_writer(' ')
                __M_writer(escape(_('Admin')))
                __M_writer(' <b class="caret"></b></a>\r\n                              <ul class="dropdown-menu">\r\n                                <li><a href="')
                __M_writer(escape(tg.url('/admin/users')))
                __M_writer('">')
                __M_writer(escape(TIM.ICO(16, 'apps/system-users')))
                __M_writer(' ')
                __M_writer(escape(_('Users')))
                __M_writer('</a></li>\r\n                                <li><a href="')
                __M_writer(escape(tg.url('/admin/workspaces')))
                __M_writer('">')
                __M_writer(escape(TIM.ICO(16, 'places/folder-remote')))
                __M_writer(' ')
                __M_writer(escape(_('Workspaces')))
                __M_writer('</a></li>\r\n')
                __M_writer('                              </ul>\r\n                            </li>\r\n')
            __M_writer('\r\n')
            if h.is_debug_mode():
                __M_writer('                          <li class="dropdown">\r\n                              <a href="#" class="dropdown-toggle" data-toggle="dropdown">')
                __M_writer(escape(TIM.ICO(16, 'categories/applications-system')))
                __M_writer(' Debug <b class="caret"></b></a>\r\n                              <ul class="dropdown-menu">\r\n                                <li><a href="')
                __M_writer(escape(tg.url('/debug/environ')))
                __M_writer('">')
                __M_writer(escape(TIM.ICO(16, 'apps/internet-web-browser')))
                __M_writer(' request.environ</a></li>\r\n                                <li><a href="')
                __M_writer(escape(tg.url('/debug/identity')))
                __M_writer('">')
                __M_writer(escape(TIM.ICO(16, 'actions/contact-new')))
                __M_writer(' request.identity</a></li>\r\n                                <li class="divider" role="presentation"></li>\r\n                                <li><a href="')
                __M_writer(escape(tg.url('/debug/iconset-fa')))
                __M_writer('">')
                __M_writer(escape(TIM.ICO(16, 'mimetypes/image-x-generic')))
                __M_writer(' Icon set - Font Awesome</a></li>\r\n                                <li><a href="')
                __M_writer(escape(tg.url('/debug/iconset-tango')))
                __M_writer('">')
                __M_writer(escape(TIM.ICO(16, 'mimetypes/image-x-generic')))
                __M_writer(' Icon set - Tango Icons</a></li>\r\n                              </ul>\r\n                          </li>\r\n')
            __M_writer('                    </ul>\r\n')
        __M_writer('\r\n                <ul class="nav navbar-nav navbar-right">\r\n\r\n')
        if request.identity:
            __M_writer('                        <li class="dropdown">\r\n                            <a href="#" class="dropdown-toggle" data-toggle="dropdown">\r\n                              ')
            __M_writer(escape(request.identity['user'].display_name))
            __M_writer('\r\n                            </a>\r\n                            <ul class="dropdown-menu pull-right">\r\n                                <li>\r\n                                  <a href="')
            __M_writer(escape(tg.url('/user/me')))
            __M_writer('">')
            __M_writer(TIM.ICO(16, 'actions/contact-new'))
            __M_writer(' ')
            __M_writer(escape(_('My account')))
            __M_writer('</a>\r\n                                </li>\r\n                                <li class="divider" role="presentation"></li>\r\n                                <li>\r\n                                  <a href="')
            __M_writer(escape(tg.url('/logout_handler')))
            __M_writer('">\r\n                                  ')
            __M_writer(TIM.ICO(16, 'status/status-locked'))
            __M_writer(' ')
            __M_writer(escape(_('Logout')))
            __M_writer('</a>\r\n                                </li>\r\n                            </ul>\r\n                        </li>\r\n')
        else:
            __M_writer('                        <li><a href="')
            __M_writer(escape(tg.url('/')))
            __M_writer('">')
            __M_writer(escape(TIM.ICO(16, 'status/status-unlocked')))
            __M_writer(' ')
            __M_writer(escape(_('Login')))
            __M_writer('</a></li>\r\n')
        __M_writer('\r\n')
        __M_writer('                </ul>\r\n            </div>\r\n        </div>\r\n    </div>\r\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_content_wrapper(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        self = context.get('self', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\r\n    ')
        __M_writer(escape(TIM.FLASH_MSG('col-sm-11')))
        __M_writer('\r\n    ')
        __M_writer(escape(self.body()))
        __M_writer('\r\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"23": 1, "26": 0, "34": 1, "35": 5, "36": 5, "37": 7, "38": 7, "39": 13, "40": 13, "41": 14, "42": 14, "43": 15, "44": 15, "45": 18, "46": 18, "47": 19, "48": 19, "49": 22, "50": 22, "51": 23, "52": 23, "53": 24, "54": 24, "55": 27, "56": 27, "57": 28, "58": 28, "59": 34, "60": 36, "61": 41, "62": 43, "63": 58, "64": 157, "70": 45, "76": 45, "77": 48, "78": 48, "79": 49, "80": 49, "86": 36, "95": 38, "100": 38, "101": 39, "102": 39, "108": 43, "112": 43, "118": 61, "128": 61, "129": 71, "130": 71, "131": 73, "132": 73, "133": 73, "134": 77, "135": 78, "136": 79, "137": 79, "138": 79, "139": 79, "140": 79, "141": 79, "142": 80, "143": 80, "144": 80, "145": 80, "146": 80, "147": 80, "148": 82, "149": 83, "150": 84, "151": 84, "152": 84, "153": 84, "154": 86, "155": 86, "156": 86, "157": 86, "158": 86, "159": 86, "160": 87, "161": 87, "162": 87, "163": 87, "164": 87, "165": 87, "166": 91, "167": 94, "168": 95, "169": 96, "170": 97, "171": 97, "172": 99, "173": 99, "174": 99, "175": 99, "176": 100, "177": 100, "178": 100, "179": 100, "180": 102, "181": 102, "182": 102, "183": 102, "184": 103, "185": 103, "186": 103, "187": 103, "188": 107, "189": 109, "190": 112, "191": 122, "192": 124, "193": 124, "194": 128, "195": 128, "196": 128, "197": 128, "198": 128, "199": 128, "200": 132, "201": 132, "202": 133, "203": 133, "204": 133, "205": 133, "206": 137, "207": 138, "208": 138, "209": 138, "210": 138, "211": 138, "212": 138, "213": 138, "214": 140, "215": 153, "221": 31, "227": 31, "228": 32, "229": 32, "230": 33, "231": 33, "237": 231}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_authenticated.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_authenticated.mak"}
__M_END_METADATA
"""
