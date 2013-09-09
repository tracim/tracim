# -*- encoding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 9
_modified_time = 1378288240.889538
_enable_loop = True
_template_filename = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/error.mak'
_template_uri = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/error.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = []


def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        message = context.get('message', UNDEFINED)
        code = context.get('code', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 1
        __M_writer(u'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"\n                      "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n<html>\n\n<head>\n  <meta content="text/html; charset=UTF-8" http-equiv="content-type"/>\n  <title>A ')
        # SOURCE LINE 7
        __M_writer(escape(code))
        __M_writer(u' Error has Occurred </title>\n</head>\n\n<body>\n<h1>Error ')
        # SOURCE LINE 11
        __M_writer(escape(code))
        __M_writer(u'</h1>\n\n')
        # SOURCE LINE 13

        import re
        mf = re.compile(r'(</?)script', re.IGNORECASE)
        def fixmessage(message):
            return mf.sub(r'\1noscript', message)
        
        
        __M_locals_builtin_stored = __M_locals_builtin()
        __M_locals.update(__M_dict_builtin([(__M_key, __M_locals_builtin_stored[__M_key]) for __M_key in ['re','mf','fixmessage'] if __M_key in __M_locals_builtin_stored]))
        # SOURCE LINE 18
        __M_writer(u'\n\n<div>')
        # SOURCE LINE 20
        __M_writer(fixmessage(message) )
        __M_writer(u'</div>\n</body>\n</html>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


