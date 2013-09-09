# -*- encoding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 9
_modified_time = 1378373689.977387
_enable_loop = True
_template_filename = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/about.mak'
_template_uri = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/about.mak'
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
    pass
def _mako_inherit(template, context):
    _mako_generate_namespaces(context)
    return runtime._inherit_from(context, u'local:templates.master', _template_uri)
def render_body(context,**pageargs):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_locals = __M_dict_builtin(pageargs=pageargs)
        tg = context.get('tg', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 1
        __M_writer(u'\n\n')
        # SOURCE LINE 5
        __M_writer(u'\n\n   <div class="row">\n      <div class="span12">\n        <div class="page-header">\n          <h2>Architectural basics of a quickstart TG2 site.</h2>\n        </div>\n\n        <p>The TG2 quickstart command produces this basic TG site. Here\'s how it works.</p>\n      </div>\n\n      <div class="span4">\n        <div class="well" style="padding: 8px 0;">\n          <ul class="nav nav-list">\n            <li class="nav-header">About Architecture</li>\n            <li><a href="#data-model">Data Model</a></li>\n            <li><a href="#url-structure">URL Structure</a></li>\n            <li><a href="#template-reuse">Web page element\'s reuse</a></li>\n            <li py:if="tg.auth_stack_enabled" class="nav-header">Authentication</li>\n            <li py:if="tg.auth_stack_enabled"><a href="#authentication">Authorization and Authentication</a></li>\n          </ul>\n        </div>\n\n        <div class="well" id="data-model">\n          <h3>Code my data model</h3>\n\n          <p>When you want a model for storing favorite links or wiki content, the\n          <code>/model</code> folder in your site is ready to go.</p>\n\n          <p>You can build a dynamic site without any data model at all. There still be a\n          default data-model template for you if you didn\'t enable authentication and\n          authorization in quickstart. If you have enabled authorization, the auth\n          data-model is ready-made.</p>\n        </div>\n\n        <div class="well" id="url-structure">\n          <h3>Design my URL structure</h3>\n\n          <p>The "<code>root.py</code>" file under the <code>/controllers</code> folder has\n          your URLs. When you called this url (<code><a href=\n          "')
        # SOURCE LINE 45
        __M_writer(escape(tg.url('/about')))
        __M_writer(u'">about</a></code>), the command went through the\n          RootController class to the <code>about()</code> method.</p>\n\n          <p>Those Python methods are responsible to create the dictionary of variables\n          that will be used in your web views (template).</p>\n        </div>\n      </div>\n\n      <div class="span8"><img src=\n      "http://www.turbogears.org/2.1/docs/_images/tg2_files.jpg" alt=\n      "TurboGears2 quickstarted project" /></div>\n    </div>\n\n    <div class="row">\n      <div class="span12" id="template-reuse">\n        <h3>Reuse the web page elements</h3>\n\n        <p>A web page viewed by user could be constructed by single or several reusable\n        templates under <code>/templates</code>. Take \'about\' page for example, each\n        reusable templates generating a part of the page. We\'ll cover them in the order of\n        where they are found, listed near the top of the about.html template</p>\n\n        <div class="row">\n          <div class="span6">\n            <p><strong><span class="label label-info">header.html</span></strong> - The\n            "header.html" template contains the HTML code to display the \'header\': The div,\n            the h1 tag, and the subtitle are there, and the the blue gradient, TG2 logo,\n            are placed by way of the .css file (from style.css) are all at the top of every\n            page it is included on. When the "about.html" template is called, it includes\n            this "header.html" template (and the others) with a <code>&lt;xi:include\n            /&gt;</code> tag, part of the Genshi templating system. The "header.html"\n            template is not a completely static HTML -- it also includes (via\n            <code>&lt;xi:include/&gt;</code> tag) "master.html", which dynamically displays\n            the current page name with a Genshi template method called "replace" with the\n            code: <code>&lt;span py:replace="page"/&gt;</code>. It means replace this\n            <code>&lt;span /&gt;</code> region with the contents found in the variable\n            \'page\' that has been sent in the dictionary to this "about.html" template, and\n            is available through that namespace for use by this "header.html" template.\n            That\'s how it changes in the header depending on what page you are\n            visiting.</p>\n\n            <p><strong><span class="label label-info">sidebars.html</span></strong> - The\n            sidebars (navigation areas on the right side of the page) are generated as two\n            separate <code>py:def</code> blocks in the "sidebars.html" template. The\n            <code>py:def</code> construct is best thought of as a "macro" code... a simple\n            way to separate and reuse common code snippets. All it takes to include these\n            on the "about.html" page template is to write</p>\n            <pre><span>$</span>{sidebar_top()}\n<span>$</span>{sidebar_bottom()}\n  </pre>in the page where they are wanted. CSS styling (in "/public/css/style.css") floats\n  them off to the right side. You can remove a sidebar or add more of them, and the CSS\n  will place them one atop the other.\n\n            <p>This is, of course, also exactly how the header and footer templates are\n            also displayed in their proper places, but we\'ll cover that in the\n            "master.html" template below.</p>\n\n            <p>Oh, and in sidebar_top we\'ve added a dynamic menu that shows the link to\n            this page at the top when you\'re at the "index" page, and shows a link to the\n            Home (index) page when you\'re here. Study the "sidebars.html" template to see\n            how we used <code>py:choose</code> for that.</p>\n          </div>\n\n          <div class="span6">\n            <p><strong><span class="label label-info">footer.html</span></strong> - The\n            "footer.html" block is simple, but also utilizes a special "replace" method to\n            set the current YEAR in the footer copyright message. The code is:</p>\n            <pre>\n  &lt;span py:replace="now.strftime(\'%Y\')"&gt;\n  </pre>and it uses the variable "now" that was passed in with the dictionary of variables.\n  But because "now" is a datetime object, we can use the Python <code>"strftime()"</code>\n  method with the "replace" call to say "Just Display The Year Here". Simple, elegant; we\n  format the date display in the template (the View in the Model/View/Controller\n  architecture) rather than formatting it in the Controller method and sending it to the\n  template as a string variable.\n\n            <p><strong><span class="label label-info">master.html</span></strong> - The\n            "master.html" template is called last, by design. The "master.html" template\n            controls the overall design of the page we\'re looking at, calling first the\n            "header" py:def macro, then the putting everything from this "about.html"\n            template into the "main_content" div, and then calling the "footer" macro at\n            the end. Thus the "master.html" template provides the overall architecture for\n            each page in this site.</p>\n\n            <p>But why then shouldn\'t we call it first? Isn\'t it the most important?\n            Perhaps, but that\'s precisely why we call it LAST. The "master.html" template\n            needs to know where to find everything else, everything that it will use in\n            py:def macros to build the page. So that means we call the other templates\n            first, and then call "master.html".</p>\n\n            <p>There\'s more to the "master.html" template... study it to see how the\n            &lt;title&gt; tags and static JS and CSS files are brought into the page.\n            Templating with Genshi is a powerful tool and we\'ve only scratched the surface.\n            There are also a few little CSS tricks hidden in these pages, like the use of a\n            "clearingdiv" to make sure that your footer stays below the sidebars and always\n            looks right. That\'s not TG2 at work, just CSS. You\'ll need all your skills to\n            build a fine web app, but TG2 will make the hard parts easier so that you can\n            concentrate more on good design and content rather than struggling with\n            mechanics.</p>\n          </div>\n\n          <div class="span12" id="authentication" py:if="tg.auth_stack_enabled">\n            <h3>Authentication &amp; Authorization in a TG2 site.</h3>\n\n            <p>If you have access to this page, this means you have enabled authentication\n            and authorization in the quickstart to create your project.</p>\n\n            <p>The paster command will have created a few specific controllers for you. But\n            before you go to play with those controllers you\'ll need to make sure your\n            application has been properly bootstapped. This is dead easy, here is how to do\n            this:</p>\n            <pre>paster setup-app development.ini</pre>\n\n            <p>inside your application\'s folder and you\'ll get a database setup (using the\n            preferences you have set in your development.ini file). This database will also\n            have been prepopulated with some default logins/passwords so that you can test\n            the secured controllers and methods.</p>\n\n            <p>To change the comportement of this setup-app command you just need to edit\n            the <code>websetup.py</code> file.</p>\n\n            <p>Now try to visiting the <a href=\n            "')
        # SOURCE LINE 167
        __M_writer(escape(tg.url('/manage_permission_only')))
        __M_writer(u'">manage_permission_only</a> URL. You will\n            be challenged with a login/password form.</p>\n\n            <p>Only managers are authorized to visit this method. You will need to log-in\n            using:</p>\n            <pre>login: manager\npassword: managepass</pre>\n\n            <p>Another protected resource is <a href=\n            "')
        # SOURCE LINE 176
        __M_writer(escape(tg.url('/editor_user_only')))
        __M_writer(u'">editor_user_only</a>. This one is protected by\n            a different set of permissions. You will need to be <code>editor</code> with a\n            password of <code>editpass</code> to be able to access it.</p>\n\n            <p>The last kind of protected resource in this quickstarted app is a full so\n            called <a href="')
        # SOURCE LINE 181
        __M_writer(escape(tg.url('/secc')))
        __M_writer(u'">secure controller</a>. This controller is\n            protected globally. Instead of having a @require decorator on each method, we\n            have set an allow_only attribute at the class level. All the methods in this\n            controller will require the same level of access. You need to be manager to\n            access <a href="')
        # SOURCE LINE 185
        __M_writer(escape(tg.url('/secc')))
        __M_writer(u'">secc</a> or <a href=\n            "')
        # SOURCE LINE 186
        __M_writer(escape(tg.url('/secc/some_where')))
        __M_writer(u'">secc/some_where</a>.</p>\n          </div>\n        </div>\n      </div>\n    </div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        # SOURCE LINE 3
        __M_writer(u'\nLearning TurboGears 2.3: Quick guide to the Quickstart pages.\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


