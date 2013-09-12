# -*- encoding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 9
_modified_time = 1378916616.992414
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
        __M_writer(u'" />\n\n    <link rel="stylesheet" type="text/css" media="screen" href="')
        # SOURCE LINE 11
        __M_writer(escape(tg.url('/css/bootstrap-datetimepicker.min.css')))
        __M_writer(u'" />\n\n    <style>\n      /* Wrapper for page content to push down footer */\n      #wrap {\n        min-height: 100%;\n        height: auto !important;\n        height: 100%;\n        /* Negative indent footer by it\'s height */\n        margin: 0 auto -60px;\n      }\n\n      /* Set the fixed height of the footer here */\n      #push,\n      #footer {\n        height: 60px;\n      }\n      #footer {\n        background-color: #f5f5f5;\n      }\n\n      /* Lastly, apply responsive CSS fixes as necessary */\n      @media (max-width: 767px) {\n        #footer {\n          margin-left: -20px;\n          margin-right: -20px;\n          padding-left: 20px;\n          padding-right: 20px;\n        }\n      }\n      \n\ndiv.pod-toolbar {\n  visibility: hidden;\n  position: absolute;\n  right: 1.2em;\n  top: 0;\n}\n\n.pod-toolbar-parent {\n  border-bottom: 1px dotted #CCC;\n}\n.pod-toolbar-parent:Hover {\n  background-color: #EFEFEF;\n}\n.pod-toolbar-parent:Hover > div.pod-toolbar {\n  visibility: visible;\n}\n.pod-status {\n  position: absolute;\n  width: 1.2em;\n  text-align: center;\n  right: 0;\n  top: 0;\n}\n\nh3:Hover div.pod-toolbar {\n  visibility: visible;\n}\n\nbody { padding-top: 60px; }\n@media screen and (max-width: 768px) {\n    body { padding-top: 0px; }\n}\n\n    </style>\n</head>\n<body class="')
        # SOURCE LINE 78
        __M_writer(escape(self.body_class()))
        __M_writer(u'">\n\n  <div class="container">\n    ')
        # SOURCE LINE 81
        __M_writer(escape(self.main_menu()))
        __M_writer(u'\n    ')
        # SOURCE LINE 82
        __M_writer(escape(self.content_wrapper()))
        __M_writer(u'\n    ')
        # SOURCE LINE 83
        __M_writer(escape(self.footer()))
        __M_writer(u'\n  </div>\n\n  <script src="http://code.jquery.com/jquery.js"></script>\n  <script src="')
        # SOURCE LINE 87
        __M_writer(escape(tg.url('/javascript/bootstrap.min.js')))
        __M_writer(u'"></script>\n\n<!-- WYSIWYG Text editor -->\n<link rel="stylesheet" type="text/css" href="/bootstrap-wysihtml5-0.0.2/bootstrap-wysihtml5-0.0.2.css"></link>\n<!--link rel="stylesheet" type="text/css" href="/bootstrap-wysihtml5-0.0.2/libs/css/bootstrap.min.css"></link-->\n\n<script src="/bootstrap-wysihtml5-0.0.2/libs/js/wysihtml5-0.3.0_rc2.js"></script>\n<script src="/bootstrap-wysihtml5-0.0.2/bootstrap-wysihtml5-0.0.2.js"></script>\n<script src="/javascript/bootstrap-datetimepicker.min.js"></script>\n\n<style>\ntr:Hover td div.pod-toolbar {\n  visibility: hidden;\n}\ntr:Hover td div.pod-toolbar {\n  visibility: visible;\n}\n\n.pod-status-grey-light  { background-color: #DDD; }\n.pod-status-grey-middle { background-color: #BBB; }\n.pod-status-grey-dark   { background-color: #AAA; }\n\n</style>\n\n  \n            <script>\n            $(\'#create_document_save_button\').on(\'click\', function(e){\n              // We don\'t want this to act as a link so cancel the link action\n              e.preventDefault();\n\n              // Find form and submit it\n              $(\'#create_document_form\').submit();\n            });\n            </script>\n\n            <script>\n              $(document).ready(function() {\n\n                \n                $(\'#current_node_textarea\').wysihtml5({\n                  "font-styles": true, //Font styling, e.g. h1, h2, etc. Default true\n                  "emphasis": true, //Italics, bold, etc. Default true\n                  "lists": true, //(Un)ordered lists, e.g. Bullets, Numbers. Default true\n                  "html": true, //Button which allows you to edit the generated HTML. Default false\n                  "link": false, //Button to insert a link. Default true\n                  "image": false, //Button to insert an image. Default true,\n                  // "color": true //Button to change color of font  \n                });\n                $(\'#current_node_textarea\').css(\'margin-bottom\', \'0\');\n                $(\'#current_node_textarea\').css("min-height", "12em");\n                $(\'#current_node_textarea\').addClass("span5");\n\n\n                /* Edit title form */\n                $("#current-document-title-edit-form" ).css("display", "none");\n                $("#current-document-title" ).dblclick(function() {\n                  $("#current-document-title" ).css("display", "none");\n                  $("#current-document-title-edit-form" ).css("display", "block");\n                });\n                $("#current-document-title-edit-cancel-button" ).click(function() {\n                  $("#current-document-title" ).css("display", "block");\n                  $("#current-document-title-edit-form" ).css("display", "none");\n                });\n                $(\'#current-document-title-save-cancel-button\').on(\'click\', function(e){\n                  // We don\'t want this to act as a link so cancel the link action\n                  e.preventDefault();\n                  $(\'#current-document-title-edit-form\').submit();\n                });\n\n                /* Edit content form */\n                $("#current-document-content-edit-form" ).css("display", "none");\n                $("#current-document-content-edit-button" ).click(function() {\n                  $("#current-document-content" ).css("display", "none");\n                  $("#current-document-content-edit-form" ).css("display", "block");\n                });\n                $("#current-document-content" ).dblclick(function() {\n                  $("#current-document-content" ).css("display", "none");\n                  $("#current-document-content-edit-form" ).css("display", "block");\n                });\n                $("#current-document-content-edit-cancel-button" ).click(function() {\n                  $("#current-document-content" ).css("display", "block");\n                  $("#current-document-content-edit-form" ).css("display", "none");\n                });\n                $(\'#current-document-content-edit-save-button\').on(\'click\', function(e){\n                  // We don\'t want this to act as a link so cancel the link action\n                  e.preventDefault();\n                  $(\'#current-document-content-edit-form\').submit();\n                });\n\n\n                /* Add event form hide/show behavior */\n                $("#current-document-add-event-button" ).click(function() {\n                  $("#current-document-add-event-form" ).css("display", "block");\n                  $("#current-document-add-event-button" ).css("display", "none");\n                });\n                $(\'#current-document-add-event-cancel-button\').on(\'click\', function(e){\n                  $("#current-document-add-event-form" ).css("display", "none");\n                  $("#current-document-add-event-button" ).css("display", "block");\n                });\n                $(\'#current-document-add-event-save-button\').on(\'click\', function(e){\n                  e.preventDefault(); // We don\'t want this to act as a link so cancel the link action\n                  $(\'#current-document-add-event-form\').submit();\n                });\n\n\n\n\n/*                $(\'.date-picker-input\').datepicker({\n                  format: \'mm-dd-yyyy\'\n                });\n*/\n                $(function() {\n                  $(\'.datetime-picker-input-div\').datetimepicker({\n                    language: \'fr-FR\',\n                    pickSeconds: false\n                  });\n                });\n\n              });\n              \n            </script>\n</body>\n\n')
        # SOURCE LINE 220
        __M_writer(u'\n\n')
        # SOURCE LINE 222
        __M_writer(u'\n')
        # SOURCE LINE 226
        __M_writer(u'\n\n')
        # SOURCE LINE 228
        __M_writer(u'\n\n')
        # SOURCE LINE 234
        __M_writer(u'\n\n')
        # SOURCE LINE 294
        __M_writer(u'\n\n\n</html>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_footer(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        h = context.get('h', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 230
        __M_writer(u'\n  <div class="footer hidden-tablet hidden-phone">\n    <p>Copyright &copy; pod project ')
        # SOURCE LINE 232
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
        # SOURCE LINE 223
        __M_writer(u'\n  <meta charset="')
        # SOURCE LINE 224
        __M_writer(escape(response.charset))
        __M_writer(u'" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        # SOURCE LINE 228
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
        # SOURCE LINE 236
        __M_writer(u'\n  <div id="pod-navbar" class="navbar navbar-fixed-top">\n    <div class="navbar-inner">\n      <div class="container">\n        <a class="brand" href="#"><!--img src="')
        # SOURCE LINE 240
        __M_writer(escape(tg.url('/img/turbogears_logo.png')))
        __M_writer(u'" alt="TurboGears 2"/--> <strong>pod</strong></a>\n        <div class="nav-collapse">\n          <ul class="nav">\n            <li class="active"><a href="')
        # SOURCE LINE 243
        __M_writer(escape(tg.url('/dashboard')))
        __M_writer(u'"><i class="icon-home icon-white"></i> Dashboard</a></li>\n            <li><a href="#">Link</a></li>\n            <li><a href="#">Link</a></li>\n            <li><a href="#">Link</a></li>\n')
        # SOURCE LINE 247
        if request.identity:
            # SOURCE LINE 248
            __M_writer(u'            <li class="dropdown">\n              <a href="#" class="dropdown-toggle" data-toggle="dropdown">Admin <b class="caret"></b></a>\n              <ul class="dropdown-menu">\n                <li class="')
            # SOURCE LINE 251
            __M_writer(escape(('', 'active')[page=='admin']))
            __M_writer(u'"><a href="')
            __M_writer(escape(tg.url('/admin')))
            __M_writer(u'">Manage</a></li>\n                <li class="')
            # SOURCE LINE 252
            __M_writer(escape(('', 'active')[page=='about']))
            __M_writer(u'"><a href="')
            __M_writer(escape(tg.url('/about')))
            __M_writer(u'">About</a></li>\n                <li class="')
            # SOURCE LINE 253
            __M_writer(escape(('', 'active')[page=='data']))
            __M_writer(u'"><a href="')
            __M_writer(escape(tg.url('/data')))
            __M_writer(u'">Serving Data</a></li>\n                <li class="')
            # SOURCE LINE 254
            __M_writer(escape(('', 'active')[page=='environ']))
            __M_writer(u'"><a href="')
            __M_writer(escape(tg.url('/environ')))
            __M_writer(u'">WSGI Environment</a></li>\n              </ul>\n            </li>\n')
        # SOURCE LINE 258
        __M_writer(u'          </ul>\n          <ul class="nav pull-right">\n')
        # SOURCE LINE 260
        if not request.identity:
            # SOURCE LINE 261
            __M_writer(u'              <li class="dropdown">\n                <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="icon-user"></i> Login</a>\n                <ul class="dropdown-menu pull-right">\n                  <li class="text-center">\n                    <form action="')
            # SOURCE LINE 265
            __M_writer(escape(tg.url('/login_handler')))
            __M_writer(u'">\n                      <fieldset>\n                        <legend>Sign in</legend>\n                      <input class="span2" type="text" id="login" name="login" placeholder="email...">\n                      <input class="span2" type="password" id="password" name="password" placeholder="password...">\n                      <div class="span2 control-group">\n                        Remember me <input type="checkbox" id="loginremember" name="remember" value="2252000"/>\n                      </div>\n                      <input type="submit" id="submit" value="Login" />\n                      </fieldset>\n                    </form>\n                   <li class="divider"></li>\n                   <li><a href="">Register</a></li>\n                 </ul>\n              </li>\n')
            # SOURCE LINE 280
        else:
            # SOURCE LINE 281
            __M_writer(u'              <li>\n                <a href="')
            # SOURCE LINE 282
            __M_writer(escape(tg.url('/logout_handler')))
            __M_writer(u'"><i class="icon-off"></i> Logout</a>\n              </li>\n')
        # SOURCE LINE 285
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
        # SOURCE LINE 210
        __M_writer(u'\n  ')
        # SOURCE LINE 211

        flash=tg.flash_obj.render('flash', use_js=False)
          
        
        # SOURCE LINE 213
        __M_writer(u'\n')
        # SOURCE LINE 214
        if flash:
            # SOURCE LINE 215
            __M_writer(u'    <div class="row"><div class="span8 offset2">\n      ')
            # SOURCE LINE 216
            __M_writer(flash )
            __M_writer(u'\n    </div></div>\n')
        # SOURCE LINE 219
        __M_writer(u'  ')
        __M_writer(escape(self.body()))
        __M_writer(u'\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


