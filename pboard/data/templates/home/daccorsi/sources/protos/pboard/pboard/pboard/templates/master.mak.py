# -*- encoding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 9
_modified_time = 1378734449.111631
_enable_loop = True
_template_filename = u'/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/master.mak'
_template_uri = u'/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/master.mak'
_source_encoding = 'utf-8'
from markupsafe import escape_silent as escape
_exports = ['footer', 'body_class', 'meta', 'title', 'main_menu', 'content_wrapper']


def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        tg = context.get('tg', UNDEFINED)
        self = context.get('self', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 1
        __M_writer(u'<!DOCTYPE html>\n<html>\n<head>\n    ')
        # SOURCE LINE 4
        __M_writer(escape(self.meta()))
        __M_writer(u'\n    <title>')
        # SOURCE LINE 5
        __M_writer(escape(self.title()))
        __M_writer(u'</title>\n    <link rel="stylesheet" type="text/css" media="screen" href="')
        # SOURCE LINE 6
        __M_writer(escape(tg.url('/css/bootstrap.min.css')))
        __M_writer(u'" />\n    <link rel="stylesheet" type="text/css" media="screen" href="')
        # SOURCE LINE 7
        __M_writer(escape(tg.url('/css/bootstrap-responsive.min.css')))
        __M_writer(u'" />\n    <link rel="stylesheet" type="text/css" media="screen" href="')
        # SOURCE LINE 8
        __M_writer(escape(tg.url('/css/style.css')))
        __M_writer(u'" />\n    <link rel="stylesheet" type="text/css" media="screen" href="')
        # SOURCE LINE 9
        __M_writer(escape(tg.url('/css/glyphicons.css')))
        __M_writer(u'" />\n\n    <style>\n      /* Wrapper for page content to push down footer */\n      #wrap {\n        min-height: 100%;\n        height: auto !important;\n        height: 100%;\n        /* Negative indent footer by it\'s height */\n        margin: 0 auto -60px;\n      }\n\n      /* Set the fixed height of the footer here */\n      #push,\n      #footer {\n        height: 60px;\n      }\n      #footer {\n        background-color: #f5f5f5;\n      }\n\n      /* Lastly, apply responsive CSS fixes as necessary */\n      @media (max-width: 767px) {\n        #footer {\n          margin-left: -20px;\n          margin-right: -20px;\n          padding-left: 20px;\n          padding-right: 20px;\n        }\n      }\n    </style>\n</head>\n<body class="')
        # SOURCE LINE 41
        __M_writer(escape(self.body_class()))
        __M_writer(u'">\n\n  <div class="container">\n    ')
        # SOURCE LINE 44
        __M_writer(escape(self.main_menu()))
        __M_writer(u'\n    ')
        # SOURCE LINE 45
        __M_writer(escape(self.content_wrapper()))
        __M_writer(u'\n    ')
        # SOURCE LINE 46
        __M_writer(escape(self.footer()))
        __M_writer(u'\n  </div>\n\n  <script src="http://code.jquery.com/jquery.js"></script>\n  <script src="')
        # SOURCE LINE 50
        __M_writer(escape(tg.url('/javascript/bootstrap.min.js')))
        __M_writer(u'"></script>\n\n<!-- WYSIWYG Text editor -->\n<link rel="stylesheet" type="text/css" href="/bootstrap-wysihtml5-0.0.2/bootstrap-wysihtml5-0.0.2.css"></link>\n<!--link rel="stylesheet" type="text/css" href="/bootstrap-wysihtml5-0.0.2/libs/css/bootstrap.min.css"></link-->\n\n<script src="/bootstrap-wysihtml5-0.0.2/libs/js/wysihtml5-0.3.0_rc2.js"></script>\n<script src="/bootstrap-wysihtml5-0.0.2/bootstrap-wysihtml5-0.0.2.js"></script>\n\n<style>\n#addFolderNode {\n  width: 800px;\n  margin-left: -400px;\n}\n</style>\n\n  \n            <script>\n            $(\'#create_document_save_button\').on(\'click\', function(e){\n              // We don\'t want this to act as a link so cancel the link action\n              e.preventDefault();\n\n              // Find form and submit it\n              $(\'#create_document_form\').submit();\n            });\n            </script>\n\n            <script>\n              $(document).ready(function() {\n                $(\'#data_content\').wysihtml5();\n              });\n            </script>\n</body>\n\n')
        # SOURCE LINE 94
        __M_writer(u'\n\n')
        # SOURCE LINE 96
        __M_writer(u'\n')
        # SOURCE LINE 100
        __M_writer(u'\n\n')
        # SOURCE LINE 102
        __M_writer(u'\n\n')
        # SOURCE LINE 108
        __M_writer(u'\n\n')
        # SOURCE LINE 168
        __M_writer(u'\n\n</html>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_footer(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 104
        __M_writer(u'\n  <div class="footer hidden-tablet hidden-phone">\n    <p>Copyright &copy; pod project ')
        # SOURCE LINE 106
        __M_writer(escape(h.current_year()))
        __M_writer(u'</p>\n  </div>\n')
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
        # SOURCE LINE 97
        __M_writer(u'\n  <meta charset="')
        # SOURCE LINE 98
        __M_writer(escape(response.charset))
        __M_writer(u'" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        # SOURCE LINE 102
        __M_writer(u'  ')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_main_menu(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        request = context.get('request', UNDEFINED)
        page = context.get('page', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 110
        __M_writer(u'\n  <div class="navbar">\n    <div class="navbar-inner">\n      <div class="container">\n        <a class="brand" href="#"><img src="')
        # SOURCE LINE 114
        __M_writer(escape(tg.url('/img/turbogears_logo.png')))
        __M_writer(u'" alt="TurboGears 2"/> <strong>pod</strong></a>\n        <div class="nav-collapse">\n          <ul class="nav">\n            <li class="active"><a href="')
        # SOURCE LINE 117
        __M_writer(escape(tg.url('/dashboard')))
        __M_writer(u'"><i class="icon-home icon-white"></i> Dashboard</a></li>\n            <li><a href="#">Link</a></li>\n            <li><a href="#">Link</a></li>\n            <li><a href="#">Link</a></li>\n')
        # SOURCE LINE 121
        if request.identity:
            # SOURCE LINE 122
            __M_writer(u'            <li class="dropdown">\n              <a href="#" class="dropdown-toggle" data-toggle="dropdown">Admin <b class="caret"></b></a>\n              <ul class="dropdown-menu">\n                <li class="')
            # SOURCE LINE 125
            __M_writer(escape(('', 'active')[page=='admin']))
            __M_writer(u'"><a href="')
            __M_writer(escape(tg.url('/admin')))
            __M_writer(u'">Manage</a></li>\n                <li class="')
            # SOURCE LINE 126
            __M_writer(escape(('', 'active')[page=='about']))
            __M_writer(u'"><a href="')
            __M_writer(escape(tg.url('/about')))
            __M_writer(u'">About</a></li>\n                <li class="')
            # SOURCE LINE 127
            __M_writer(escape(('', 'active')[page=='data']))
            __M_writer(u'"><a href="')
            __M_writer(escape(tg.url('/data')))
            __M_writer(u'">Serving Data</a></li>\n                <li class="')
            # SOURCE LINE 128
            __M_writer(escape(('', 'active')[page=='environ']))
            __M_writer(u'"><a href="')
            __M_writer(escape(tg.url('/environ')))
            __M_writer(u'">WSGI Environment</a></li>\n              </ul>\n            </li>\n')
        # SOURCE LINE 132
        __M_writer(u'          </ul>\n          <ul class="nav pull-right">\n')
        # SOURCE LINE 134
        if not request.identity:
            # SOURCE LINE 135
            __M_writer(u'              <li class="dropdown">\n                <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="icon-user"></i> Login</a>\n                <ul class="dropdown-menu pull-right">\n                  <li class="text-center">\n                    <form action="')
            # SOURCE LINE 139
            __M_writer(escape(tg.url('/login_handler')))
            __M_writer(u'">\n                      <fieldset>\n                        <legend>Sign in</legend>\n                      <input class="span2" type="text" id="login" name="login" placeholder="email...">\n                      <input class="span2" type="password" id="password" name="password" placeholder="password...">\n                      <div class="span2 control-group">\n                        Remember me <input type="checkbox" id="loginremember" name="remember" value="2252000"/>\n                      </div>\n                      <input type="submit" id="submit" value="Login" />\n                      </fieldset>\n                    </form>\n                   <li class="divider"></li>\n                   <li><a href="">Register</a></li>\n                 </ul>\n              </li>\n')
            # SOURCE LINE 154
        else:
            # SOURCE LINE 155
            __M_writer(u'              <li>\n                <a href="')
            # SOURCE LINE 156
            __M_writer(escape(tg.url('/logout_handler')))
            __M_writer(u'"><i class="icon-off"></i> Logout</a>\n              </li>\n')
        # SOURCE LINE 159
        __M_writer(u'          </ul>\n\n          <form class="navbar-search pull-right" action="">\n            <input type="text" class="search-query span2" placeholder="Search">\n          </form>\n        </div><!-- /.nav-collapse -->\n      </div><!-- /.container -->\n    </div><!-- /.navbar-inner -->\n  </div><!-- /.navbar -->\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_content_wrapper(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        tg = context.get('tg', UNDEFINED)
        self = context.get('self', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 84
        __M_writer(u'\n  ')
        # SOURCE LINE 85

        flash=tg.flash_obj.render('flash', use_js=False)
          
        
        # SOURCE LINE 87
        __M_writer(u'\n')
        # SOURCE LINE 88
        if flash:
            # SOURCE LINE 89
            __M_writer(u'    <div class="row"><div class="span8 offset2">\n      ')
            # SOURCE LINE 90
            __M_writer(flash )
            __M_writer(u'\n    </div></div>\n')
        # SOURCE LINE 93
        __M_writer(u'  ')
        __M_writer(escape(self.body()))
        __M_writer(u'\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


