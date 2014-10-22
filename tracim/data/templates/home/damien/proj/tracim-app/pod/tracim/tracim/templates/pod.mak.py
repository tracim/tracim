# -*- coding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 10
_modified_time = 1413984364.065033
_enable_loop = True
_template_filename = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/pod.mak'
_template_uri = '/home/damien/proj/tracim-app/pod/tracim/tracim/templates/pod.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['HELP_MODAL_DIALOG_BUTTON', 'ICO', 'TINYMCE_INIT_SCRIPT', 'FLASH_MSG', 'MODAL_DIALOG', 'HELP_MODAL_DIALOG', 'ICO_URL', 'NO_CONTENT_INFO', 'ICO_BADGED', 'ICO_FA_BADGED']


def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        __M_writer = context.writer()
        __M_writer('\n')
        __M_writer('\n')
        __M_writer('\n')
        __M_writer('\n\n')
        __M_writer('\n')
        __M_writer('\n\n')
        __M_writer('\n                \n')
        __M_writer('\n\n')
        __M_writer('\n\n')
        __M_writer('\n\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_HELP_MODAL_DIALOG_BUTTON(context,help_page,css_special_style=''):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        def ICO(icon_size,icon_path,title=''):
            return render_ICO(context,icon_size,icon_path,title)
        __M_writer = context.writer()
        __M_writer('<a style="')
        __M_writer(escape(css_special_style))
        __M_writer('" data-toggle="modal" data-target="#help-modal-dialog-')
        __M_writer(escape(help_page))
        __M_writer('" data-remote="')
        __M_writer(escape(tg.url('/help/page/{}?mode=modal'.format(help_page))))
        __M_writer('" >')
        __M_writer(escape(ICO(16, 'apps/help-browser')))
        __M_writer('</a>')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_ICO(context,icon_size,icon_path,title=''):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('<img src="')
        __M_writer(h.IconPath(icon_size, icon_path))
        __M_writer('" alt="" title="')
        __M_writer(escape(title))
        __M_writer('"/>')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_TINYMCE_INIT_SCRIPT(context,selector):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        __M_writer('\n    <script>\n        tinymce.init({\n            menubar:false,\n            statusbar:true,\n            plugins: [ "table", "image", "charmap", "fullscreen", "autolink" ],\n\n            skin : \'custom\',\n            selector:\'')
        __M_writer(escape(selector))
        __M_writer('\',\n            toolbar: [\n              "undo redo | bold italic underline strikethrough | bullist numlist outdent indent | table | charmap | styleselect | alignleft aligncenter alignright | fullscreen",\n            ]\n        });\n    </script>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_FLASH_MSG(context,css_class=''):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        __M_writer('\n    ')
        flash=tg.flash_obj.render('flash', use_js=False) 
        
        __M_writer('\n')
        if flash:
            __M_writer('        <div class="row">\n            <div class="')
            __M_writer(escape(css_class))
            __M_writer('">\n                ')
            __M_writer(flash)
            __M_writer('\n            </div>\n        </div>\n')
            __M_writer("        <script>\n            $( document ).ready(function() {\n                $('.alert-ok').removeClass('alert-ok').addClass('alert-info');\n                $('.alert-error').removeClass('alert-error').addClass('alert-danger');\n            });\n        </script>\n")
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_MODAL_DIALOG(context,css_id,modal_size=''):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        __M_writer('\n    <div id="')
        __M_writer(escape(css_id))
        __M_writer('" class="modal" tabindex="-1" role="dialog" aria-hidden="true">\n        <div class="modal-dialog ')
        __M_writer(escape(modal_size))
        __M_writer('">\n            <div class="modal-content">\n            </div>\n        </div>\n    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_HELP_MODAL_DIALOG(context,help_page):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        __M_writer('<div id="help-modal-dialog-')
        __M_writer(escape(help_page))
        __M_writer('" class="modal" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"></div></div></div>')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_ICO_URL(context,icon_size,icon_path):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        __M_writer = context.writer()
        __M_writer(h.IconPath(icon_size, icon_path))
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_NO_CONTENT_INFO(context,message):
    __M_caller = context.caller_stack._push_frame()
    try:
        def ICO(icon_size,icon_path,title=''):
            return render_ICO(context,icon_size,icon_path,title)
        __M_writer = context.writer()
        __M_writer('<div class="alert alert-warning" role="alert">')
        __M_writer(escape(ICO(32, 'status/dialog-information')))
        __M_writer(' ')
        __M_writer(message)
        __M_writer('</div>')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_ICO_BADGED(context,icon_size,icon_path,title='',css_class='badge'):
    __M_caller = context.caller_stack._push_frame()
    try:
        def ICO(icon_size,icon_path,title=''):
            return render_ICO(context,icon_size,icon_path,title)
        __M_writer = context.writer()
        __M_writer('<span class="')
        __M_writer(escape(css_class))
        __M_writer('" rel="tooltip" data-toggle="tooltip" data-placement="bottom" title="')
        __M_writer(escape(title))
        __M_writer('">')
        __M_writer(escape(ICO(icon_size, icon_path, title)))
        __M_writer('</span>')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_ICO_FA_BADGED(context,fa_class='fa fa-flag',title='',css_style=''):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        __M_writer('<i style="')
        __M_writer(escape(css_style))
        __M_writer('" class="')
        __M_writer(escape(fa_class))
        __M_writer('" rel="tooltip" data-toggle="tooltip" data-placement="bottom" title="')
        __M_writer(escape(title))
        __M_writer('"></i>')
        return ''
    finally:
        context.caller_stack._pop_frame()


"""
__M_BEGIN_METADATA
{"source_encoding": "utf-8", "line_map": {"192": 186, "131": 1, "150": 9, "136": 1, "151": 9, "142": 9, "16": 0, "152": 9, "148": 9, "21": 1, "22": 2, "23": 3, "24": 4, "25": 6, "26": 7, "27": 9, "28": 18, "29": 34, "30": 56, "176": 4, "36": 7, "165": 3, "166": 3, "167": 3, "168": 3, "169": 3, "170": 3, "43": 7, "44": 7, "45": 7, "46": 7, "47": 7, "48": 7, "49": 7, "50": 7, "51": 7, "180": 4, "158": 3, "182": 4, "183": 4, "184": 4, "57": 2, "186": 4, "62": 2, "63": 2, "64": 2, "65": 2, "66": 2, "164": 3, "181": 4, "72": 20, "76": 20, "77": 28, "78": 28, "84": 36, "185": 4, "89": 36, "90": 37, "92": 37, "93": 38, "94": 39, "95": 40, "96": 40, "97": 41, "98": 41, "99": 49, "105": 11, "109": 11, "110": 12, "111": 12, "112": 13, "113": 13, "119": 6, "123": 6, "124": 6, "125": 6, "149": 9}, "uri": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/pod.mak", "filename": "/home/damien/proj/tracim-app/pod/tracim/tracim/templates/pod.mak"}
__M_END_METADATA
"""
