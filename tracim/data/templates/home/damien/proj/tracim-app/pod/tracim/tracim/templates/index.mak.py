# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984367.807793
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/index.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/index.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['title']


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
    return runtime._inherit_from(context, 'local:templates.master_anonymous', _template_uri)
def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        TIM = _mako_get_namespace(context, 'TIM')
        dict = context.get('dict', UNDEFINED)
        tg = context.get('tg', UNDEFINED)
        h = context.get('h', UNDEFINED)
        came_from = context.get('came_from', UNDEFINED)
        _ = context.get('_', UNDEFINED)
        login_counter = context.get('login_counter', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n')
        __M_writer('\n\n')
        __M_writer('\n\n\n<div class="container-fluid">\n    <div class="row-fluid">\n        <div>\n            <div class="row">\n                <div class="col-sm-offset-3 col-sm-5">\n                    <h1 class="text-center" style="color: ')
        __M_writer(escape(h.WEBSITE_HOME_TITLE_COLOR))
        __M_writer(';"><b>')
        __M_writer(escape(h.WEBSITE_TITLE))
        __M_writer('</b></h1>\n                </div>\n            </div>\n            <div class="row">\n                <div class="col-sm-offset-3 col-sm-2">\n                    <a class="thumbnail">\n                        <img src="')
        __M_writer(escape(h.WEBSITE_HOME_IMAGE_URL))
        __M_writer('" alt="">\n                    </a>\n                </div>\n                <div class="col-sm-3">\n                    <div class="well">\n                    \n                    <h2 style="margin-top: 0;">')
        __M_writer(escape(TIM.ICO(32, 'status/status-locked')))
        __M_writer(' ')
        __M_writer(escape(_('Login')))
        __M_writer('</h2>\n                    <form role="form" method="POST" action="')
        __M_writer(escape(tg.url('/login_handler', params=dict(came_from=came_from, __logins=login_counter))))
        __M_writer('">\n                        <div class="form-group">\n                            <div class="input-group">\n                                <div class="input-group-addon"><i class="fa fa-envelope-o"></i></div>\n                                <input type="email" name="login" class="form-control" placeholder="')
        __M_writer(escape(_('Enter email')))
        __M_writer('">\n                            </div>\n                        </div>\n                        <div class="form-group">\n                            <div class="input-group">\n                                <div class="input-group-addon"><i class="fa fa-key"></i></div>\n                                <input type="password" name="password" class="form-control" placeholder="')
        __M_writer(escape(_('Enter password')))
        __M_writer('">\n                            </div>\n                        </div>\n                        <div class="checkbox">\n                            <label>\n                                <input type="checkbox" id="loginremember" name="remember" value="2252000"/> ')
        __M_writer(escape(_('Remember me')))
        __M_writer('\n                            </label>\n                        </div>\n                        <div class="text-right">\n                            <button type="submit" class="btn btn-small btn-success">\n                                <i class="fa fa-check"></i> ')
        __M_writer(escape(_('Login')))
        __M_writer('\n                            </button>\n                        </div>\n                    </form>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n  ')
        __M_writer(h.WEBSITE_TITLE)
        __M_writer('\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"23": 2, "29": 0, "41": 1, "42": 2, "43": 6, "44": 14, "45": 14, "46": 14, "47": 14, "48": 20, "49": 20, "50": 26, "51": 26, "52": 26, "53": 26, "54": 27, "55": 27, "56": 31, "57": 31, "58": 37, "59": 37, "60": 42, "61": 42, "62": 47, "63": 47, "69": 4, "74": 4, "75": 5, "76": 5, "82": 76}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/index.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/index.mak"}
__M_END_METADATA
"""
