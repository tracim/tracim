# -*- encoding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 9
_modified_time = 1378713536.869768
_enable_loop = True
_template_filename = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/iconset.mak'
_template_uri = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/iconset.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = []


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
        __M_writer = context.writer()
        # SOURCE LINE 1
        __M_writer(u'\n\n\n        <style>\n            body{\n                padding-top: 60px;\n            }\n            #icon_grid li{\n                width: 23%;\n            }\n        </style>\n\n        <div class="navbar navbar-inverse navbar-fixed-top">\n            <div class="navbar-inner">\n                <div class="container">\n                    <a class="brand" href="./index.html">Glyphicons</a>\n                </div>\n            </div>\n        </div>\n        \n        <div class="container">\n            \n            <div class="hero-unit">\n                List Of icons\n            </div>\n            \n            <div id="icon_grid">\n                <ul class="inline">\n\n                </ul>\n            </div>\n        </div>\n\n\n    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>\n    <script>\n      $(document).ready(function() {\n        function matchStyle(className) {\n          var result = [];\n          for (var id = 0; id < document.styleSheets.length; id++) {\n            var classes = document.styleSheets[id].rules || document.styleSheets[id].cssRules;\n            for (var x = 0; x < classes.length; x++) {\n              // $(\'#icon_grid\').append(classes[x].selectorText);\n              // $(\'#icon_grid\').append("<p>bob ---</p>");\n              var item = classes[x];\n              if (classes[x]!=null) {\n                if(classes[x].selectorText!=null) {\n                  if (-1 < classes[x].selectorText.indexOf(className)) {\n                    result.push(classes[x].selectorText);\n                  }\n                }\n              }\n            }\n          }\n          return result;\n        }\n\n        var $iconList = matchStyle(\'.icon-g-\');\n        var $grid = $(\'#icon_grid ul\');\n        for (var key in $iconList) {\n          var icon = $iconList[key];\n          icon = icon.replace(\'.\', \'\');\n          $grid.append($(\'<li>\').append($(\'<i>\').addClass(icon)).append(" " + icon));\n        }\n      });</script>\n\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


