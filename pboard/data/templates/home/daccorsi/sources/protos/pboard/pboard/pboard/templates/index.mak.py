# -*- encoding:utf-8 -*-
from mako import runtime, filters, cache
UNDEFINED = runtime.UNDEFINED
__M_dict_builtin = dict
__M_locals_builtin = locals
_magic_number = 9
_modified_time = 1378381585.28781
_enable_loop = True
_template_filename = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/index.mak'
_template_uri = '/home/daccorsi/sources/protos/pboard/pboard/pboard/templates/index.mak'
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
        h = context.get('h', UNDEFINED)
        __M_writer = context.writer()
        # SOURCE LINE 1
        __M_writer(u'\n\n')
        # SOURCE LINE 5
        __M_writer(u'\n\n  <div class="row">\n    <div class="span9 hidden-phone hidden-tablet">\n      <div class="hero-unit">\n        <h1>pod <small>your information compagnion</small></h1>\n      </div>\n\n      <div class="row">\n        <div class="span3">\n          <h3>Store structured data</h3>\n          <ul>\n            <li>contact information,</li>\n            <li>notes, files,</li>\n            <li>todos, events, reminders,</li>\n            <li>...</li>\n          </ul>\n        </div>\n\n        <div class="span3">\n          <h3>Share information</h3>\n          <ul>\n            <li>Data is private, shared or public,</li>\n            <li>Send notification to co-workers,</li>\n            <li>Work together on the same data,</li>\n            <li>...</li>\n          </ul>\n        </div>\n\n        <div class="span3">\n          <h3>Manage Lifetime</h3>\n          <ul>\n            <li>Real life and information timelines,</li>\n            <li>Explore the life of information,</li>\n            <li>Create, open and close projects,</li>\n            <li>...</li>\n          </ul>\n        </div>\n      </div>\n\n      <div class="row">\n        <div class="span9">\n          <h3>Is it for me ?</h3>\n          <p>\n            You are prospecting clients? Looking for a job? Taking notes for your work? You\'re not sure ?\n          </p>\n          <p class="alert aler-warning">\n            Hey! What do you risk? Give it a try!\n          </p>\n        </div>\n      </div>\n      <div>\n        <h2>What can I do with pod ?</h2>\n        <ul style="list-style:none;">\n          <li><i class="icon-chevron-right"></i> Manage projects and tasks during their entire life:\n            <ul style="list-style:none;">\n              <li><i class="icon-chevron-right"></i> Create events and reminders</li>\n              <li><i class="icon-chevron-right"></i> Take and keep notes</li>\n              <li><i class="icon-chevron-right"></i> Keep contact information about people</li>\n              <li><i class="icon-chevron-right"></i> Organise data and information</li>\n            </ul>\n          </li>\n          <li>\n            <i class="icon-chevron-right"></i> Share up-to-date information:\n            <ul style="list-style:none;">\n              <li><i class="icon-chevron-right"></i> Organize and update information</li>\n              <li><i class="icon-chevron-right"></i> Send notifications to friends</li>\n              <li><i class="icon-chevron-right"></i> Manage information life</li>\n            </ul>\n          </li>\n        </ul>\n        If you see this page it means your installation was successful!</p>\n        <p>TurboGears 2 is rapid web application development toolkit designed to make your life easier.</p>\n        <p>\n          <a class="btn btn-primary btn-large" href="http://www.turbogears.org" target="_blank">\n            ')
        # SOURCE LINE 80
        __M_writer(escape(h.icon('book', True)))
        __M_writer(u' Learn more\n          </a>\n        </p>\n      </div>\n    </div>\n    <div class="span3">\n      <form class="well">\n        <fieldset>\n          <legend>Sign up</legend>\n          <input type="text" id="email" placeholder="Email"><br/>\n          <input type="text" id="password" placeholder="Password"><br/>\n          <input type="text" id="retype_password" placeholder="Retype your password"><br/>\n          <input type="submit" id="submit" value="Sign up" /><br/>\n        </fieldset>\n      </form>\n      \n      <div class="popover bottom">\n        <div class="arrow"></div>\n        <h3 class="popover-title">\n          Why to sign up ?\n        </h3>\n        <div>\n          <p>\n            blabla\n          </p>\n        </div>\n      </div>\n      <div class="alert alert-info">\n        <strong>Why to sign up ?</strong>\n      </div>\n      <div class="well">\n        <p>\n          <i class="icon-signal"></i> Make information live\n        </p>\n        <p>\n          <i class="icon-refresh"></i> Share up-to-date information\n        </p>\n        <p>\n          <i class="icon-list"></i> Manage tasks and projects\n        </p>\n      </div>\n    </div>\n  </div>\n\n  <div class="row">\n    <div class="span4">\n      <h3>Code your data model</h3>\n      <p> Design your data <code>model</code>, Create the database, and Add some bootstrap data.</p>\n    </div>\n\n    <div class="span4">\n      <h3>Design your URL architecture</h3>\n      <p> Decide your URLs, Program your <code>controller</code> methods, Design your\n        <code>templates</code>, and place some static files (CSS and/or Javascript). </p>\n    </div>\n\n    <div class="span4">\n      <h3>Distribute your app</h3>\n      <p> Test your source, Generate project documents, Build a distribution.</p>\n    </div>\n  </div>\n\n  <div class="notice"> Thank you for choosing TurboGears.</div>\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


def render_title(context):
    __M_caller = context.caller_stack._push_frame()
    try:
        __M_writer = context.writer()
        # SOURCE LINE 3
        __M_writer(u'\n  Welcome to TurboGears 2.3, standing on the shoulders of giants, since 2007\n')
        return ''
    finally:
        context.caller_stack._pop_frame()


