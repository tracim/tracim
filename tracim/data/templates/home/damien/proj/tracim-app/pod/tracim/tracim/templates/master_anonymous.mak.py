# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984367.828948
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_anonymous.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_anonymous.mak'
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
        __M_writer('\n<!DOCTYPE html>\n<html style="height: 100%;">\n    <head>\n\t    ')
        __M_writer(escape(self.meta()))
        __M_writer('\n        <meta charset="utf-8">\n\t    <title>')
        __M_writer(escape(self.title()))
        __M_writer('</title>\n        <meta http-equiv="X-UA-Compatible" content="IE=edge">\n        <meta name="viewport" content="width=device-width, initial-scale=1">\n        <meta name="description" content="">\n        <meta name="author" content="">\n        <link rel="icon" href="../../favicon.ico">\n        <link href="')
        __M_writer(escape(tg.url('/assets/css/bootstrap.min.css')))
        __M_writer('" rel="stylesheet">\n        <link href="')
        __M_writer(escape(tg.url('/assets/css/dashboard.css')))
        __M_writer('" rel="stylesheet">\n        <link href="')
        __M_writer(escape(tg.url('/assets/font-awesome-4.2.0/css/font-awesome.css')))
        __M_writer('" rel="stylesheet">\n    </head>\n\n    <body class="')
        __M_writer(escape(self.body_class()))
        __M_writer('" style="\n    height: 100%;\n    background: url(')
        __M_writer(escape(h.WEBSITE_HOME_BACKGROUND_IMAGE_URL))
        __M_writer(') no-repeat center bottom scroll;\n    -webkit-background-size: cover;\n    -moz-background-size: cover;\n    background-size: cover;\n    -o-background-size: cover;">\n        <script src="')
        __M_writer(escape(tg.url('/assets/js/jquery.min.js')))
        __M_writer('"></script>\n')
        __M_writer('\n        <div class="container-fluid">\n            ')
        __M_writer(escape(self.main_menu()))
        __M_writer('\n            ')
        __M_writer(escape(self.content_wrapper()))
        __M_writer('\n            ')
        __M_writer(escape(self.footer()))
        __M_writer('\n        </div>\n\n        <script src="')
        __M_writer(escape(tg.url('/assets/js/bootstrap.min.js')))
        __M_writer('"></script>\n')
        __M_writer("        <script>\n            $( document ).ready(function() {\n                $('.alert-ok').removeClass('alert-ok').addClass('alert-info');\n                $('.alert-error').removeClass('alert-error').addClass('alert-danger');\n            });\n        </script>\n\n        ")
        __M_writer(h.tracker_js())
        __M_writer('\n    </body>\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n\n')
        __M_writer('\n\n</html>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_footer(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <div class="pod-footer footer hidden-tablet hidden-phone text-center">\n        <p>\n            <a href="http://trac.im">')
        __M_writer(escape(_('Create your own email-ready collaborative workspace on trac.im')))
        __M_writer('</a> &mdash;\n            copyright &copy; 2013 - ')
        __M_writer(escape(h.current_year()))
        __M_writer(' tracim project.\n        </p>\n    </div>\n')
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
        __M_writer('\n    <meta charset="')
        __M_writer(escape(response.charset))
        __M_writer('" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_main_menu(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    <div class="navbar navbar-fixed-top navbar-fixed-top-transparent" role="navigation">\n        <div class="container-fluid">\n            <div class="navbar-header">\n                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target=".navbar-collapse">\n                    <span class="sr-only">Toggle navigation</span>\n                    <span class="icon-bar"></span>\n                    <span class="icon-bar"></span>\n                    <span class="icon-bar"></span>\n                </button>\n                <a class="navbar-brand" href="')
        __M_writer(escape(tg.url('/')))
        __M_writer('">\n')
        __M_writer('                  <img src="')
        __M_writer(escape(tg.url('/assets/img/logo.png')))
        __M_writer('" class="pull-left" style="margin: -13px 0.5em 0 -13px;"/>\n                </a>\n            </div>\n        </div>\n    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_content_wrapper(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        TIM = _mako_get_namespace(context, 'TIM')
        self = context.get('self', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    ')
        __M_writer(escape(TIM.FLASH_MSG('col-sm-5 col-sm-offset-3')))
        __M_writer('\n    ')
        __M_writer(escape(self.body()))
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"128": 84, "129": 86, "130": 86, "131": 86, "137": 50, "143": 50, "144": 51, "145": 51, "146": 52, "147": 52, "23": 1, "153": 147, "26": 0, "34": 1, "35": 5, "36": 5, "37": 7, "38": 7, "39": 13, "40": 13, "41": 14, "42": 14, "43": 15, "44": 15, "45": 18, "46": 18, "47": 20, "48": 20, "49": 25, "50": 25, "51": 27, "52": 29, "53": 29, "54": 30, "55": 30, "56": 31, "57": 31, "58": 34, "59": 34, "60": 40, "61": 47, "62": 47, "63": 53, "64": 55, "65": 60, "66": 62, "67": 71, "68": 91, "74": 64, "80": 64, "81": 67, "82": 67, "83": 68, "84": 68, "90": 55, "99": 57, "104": 57, "105": 58, "106": 58, "112": 62, "121": 74, "126": 74, "127": 84}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_anonymous.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/master_anonymous.mak"}
__M_END_METADATA
"""
