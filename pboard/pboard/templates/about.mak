<%inherit file="local:templates.master"/>

<%def name="title()">
Learning TurboGears 2.3: Quick guide to the Quickstart pages.
</%def>

   <div class="row">
      <div class="span12">
        <div class="page-header">
          <h2>Architectural basics of a quickstart TG2 site.</h2>
        </div>

        <p>The TG2 quickstart command produces this basic TG site. Here's how it works.</p>
      </div>

      <div class="span4">
        <div class="well" style="padding: 8px 0;">
          <ul class="nav nav-list">
            <li class="nav-header">About Architecture</li>
            <li><a href="#data-model">Data Model</a></li>
            <li><a href="#url-structure">URL Structure</a></li>
            <li><a href="#template-reuse">Web page element's reuse</a></li>
            <li py:if="tg.auth_stack_enabled" class="nav-header">Authentication</li>
            <li py:if="tg.auth_stack_enabled"><a href="#authentication">Authorization and Authentication</a></li>
          </ul>
        </div>

        <div class="well" id="data-model">
          <h3>Code my data model</h3>

          <p>When you want a model for storing favorite links or wiki content, the
          <code>/model</code> folder in your site is ready to go.</p>

          <p>You can build a dynamic site without any data model at all. There still be a
          default data-model template for you if you didn't enable authentication and
          authorization in quickstart. If you have enabled authorization, the auth
          data-model is ready-made.</p>
        </div>

        <div class="well" id="url-structure">
          <h3>Design my URL structure</h3>

          <p>The "<code>root.py</code>" file under the <code>/controllers</code> folder has
          your URLs. When you called this url (<code><a href=
          "${tg.url('/about')}">about</a></code>), the command went through the
          RootController class to the <code>about()</code> method.</p>

          <p>Those Python methods are responsible to create the dictionary of variables
          that will be used in your web views (template).</p>
        </div>
      </div>

      <div class="span8"><img src=
      "http://www.turbogears.org/2.1/docs/_images/tg2_files.jpg" alt=
      "TurboGears2 quickstarted project" /></div>
    </div>

    <div class="row">
      <div class="span12" id="template-reuse">
        <h3>Reuse the web page elements</h3>

        <p>A web page viewed by user could be constructed by single or several reusable
        templates under <code>/templates</code>. Take 'about' page for example, each
        reusable templates generating a part of the page. We'll cover them in the order of
        where they are found, listed near the top of the about.html template</p>

        <div class="row">
          <div class="span6">
            <p><strong><span class="label label-info">header.html</span></strong> - The
            "header.html" template contains the HTML code to display the 'header': The div,
            the h1 tag, and the subtitle are there, and the the blue gradient, TG2 logo,
            are placed by way of the .css file (from style.css) are all at the top of every
            page it is included on. When the "about.html" template is called, it includes
            this "header.html" template (and the others) with a <code>&lt;xi:include
            /&gt;</code> tag, part of the Genshi templating system. The "header.html"
            template is not a completely static HTML -- it also includes (via
            <code>&lt;xi:include/&gt;</code> tag) "master.html", which dynamically displays
            the current page name with a Genshi template method called "replace" with the
            code: <code>&lt;span py:replace="page"/&gt;</code>. It means replace this
            <code>&lt;span /&gt;</code> region with the contents found in the variable
            'page' that has been sent in the dictionary to this "about.html" template, and
            is available through that namespace for use by this "header.html" template.
            That's how it changes in the header depending on what page you are
            visiting.</p>

            <p><strong><span class="label label-info">sidebars.html</span></strong> - The
            sidebars (navigation areas on the right side of the page) are generated as two
            separate <code>py:def</code> blocks in the "sidebars.html" template. The
            <code>py:def</code> construct is best thought of as a "macro" code... a simple
            way to separate and reuse common code snippets. All it takes to include these
            on the "about.html" page template is to write</p>
            <pre><span>$</span>{sidebar_top()}
<span>$</span>{sidebar_bottom()}
  </pre>in the page where they are wanted. CSS styling (in "/public/css/style.css") floats
  them off to the right side. You can remove a sidebar or add more of them, and the CSS
  will place them one atop the other.

            <p>This is, of course, also exactly how the header and footer templates are
            also displayed in their proper places, but we'll cover that in the
            "master.html" template below.</p>

            <p>Oh, and in sidebar_top we've added a dynamic menu that shows the link to
            this page at the top when you're at the "index" page, and shows a link to the
            Home (index) page when you're here. Study the "sidebars.html" template to see
            how we used <code>py:choose</code> for that.</p>
          </div>

          <div class="span6">
            <p><strong><span class="label label-info">footer.html</span></strong> - The
            "footer.html" block is simple, but also utilizes a special "replace" method to
            set the current YEAR in the footer copyright message. The code is:</p>
            <pre>
  &lt;span py:replace="now.strftime('%Y')"&gt;
  </pre>and it uses the variable "now" that was passed in with the dictionary of variables.
  But because "now" is a datetime object, we can use the Python <code>"strftime()"</code>
  method with the "replace" call to say "Just Display The Year Here". Simple, elegant; we
  format the date display in the template (the View in the Model/View/Controller
  architecture) rather than formatting it in the Controller method and sending it to the
  template as a string variable.

            <p><strong><span class="label label-info">master.html</span></strong> - The
            "master.html" template is called last, by design. The "master.html" template
            controls the overall design of the page we're looking at, calling first the
            "header" py:def macro, then the putting everything from this "about.html"
            template into the "main_content" div, and then calling the "footer" macro at
            the end. Thus the "master.html" template provides the overall architecture for
            each page in this site.</p>

            <p>But why then shouldn't we call it first? Isn't it the most important?
            Perhaps, but that's precisely why we call it LAST. The "master.html" template
            needs to know where to find everything else, everything that it will use in
            py:def macros to build the page. So that means we call the other templates
            first, and then call "master.html".</p>

            <p>There's more to the "master.html" template... study it to see how the
            &lt;title&gt; tags and static JS and CSS files are brought into the page.
            Templating with Genshi is a powerful tool and we've only scratched the surface.
            There are also a few little CSS tricks hidden in these pages, like the use of a
            "clearingdiv" to make sure that your footer stays below the sidebars and always
            looks right. That's not TG2 at work, just CSS. You'll need all your skills to
            build a fine web app, but TG2 will make the hard parts easier so that you can
            concentrate more on good design and content rather than struggling with
            mechanics.</p>
          </div>

          <div class="span12" id="authentication" py:if="tg.auth_stack_enabled">
            <h3>Authentication &amp; Authorization in a TG2 site.</h3>

            <p>If you have access to this page, this means you have enabled authentication
            and authorization in the quickstart to create your project.</p>

            <p>The paster command will have created a few specific controllers for you. But
            before you go to play with those controllers you'll need to make sure your
            application has been properly bootstapped. This is dead easy, here is how to do
            this:</p>
            <pre>paster setup-app development.ini</pre>

            <p>inside your application's folder and you'll get a database setup (using the
            preferences you have set in your development.ini file). This database will also
            have been prepopulated with some default logins/passwords so that you can test
            the secured controllers and methods.</p>

            <p>To change the comportement of this setup-app command you just need to edit
            the <code>websetup.py</code> file.</p>

            <p>Now try to visiting the <a href=
            "${tg.url('/manage_permission_only')}">manage_permission_only</a> URL. You will
            be challenged with a login/password form.</p>

            <p>Only managers are authorized to visit this method. You will need to log-in
            using:</p>
            <pre>login: manager
password: managepass</pre>

            <p>Another protected resource is <a href=
            "${tg.url('/editor_user_only')}">editor_user_only</a>. This one is protected by
            a different set of permissions. You will need to be <code>editor</code> with a
            password of <code>editpass</code> to be able to access it.</p>

            <p>The last kind of protected resource in this quickstarted app is a full so
            called <a href="${tg.url('/secc')}">secure controller</a>. This controller is
            protected globally. Instead of having a @require decorator on each method, we
            have set an allow_only attribute at the class level. All the methods in this
            controller will require the same level of access. You need to be manager to
            access <a href="${tg.url('/secc')}">secc</a> or <a href=
            "${tg.url('/secc/some_where')}">secc/some_where</a>.</p>
          </div>
        </div>
      </div>
    </div>
