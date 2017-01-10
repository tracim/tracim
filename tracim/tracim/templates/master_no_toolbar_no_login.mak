<%namespace name="TIM" file="tracim.templates.pod"/>
<!DOCTYPE html>
<html>
    <head>
	    ${self.meta()}
        <meta charset="utf-8">
	    <title>${self.title()}</title>
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="">
        <meta name="author" content="">
        <link rel="icon" href="/favicon.ico">

        <!-- Bootstrap core CSS -->
        <link href="${tg.url('/assets/css/bootstrap.min.css')}" rel="stylesheet">

        <!-- Custom styles for this template -->
        <link href="${tg.url('/assets/css/dashboard.css')}" rel="stylesheet">
        <link href="${tg.url('/assets/font-awesome-4.2.0/css/font-awesome.css')}" rel="stylesheet">

        <!-- Just for debugging purposes. Don't actually copy these 2 lines! -->
        <!--[if lt IE 9]><script src="../../assets/js/ie8-responsive-file-warning.js"></script><![endif]-->
        <script src="${tg.url('/assets/js/ie-emulation-modes-warning.js')}"></script>

        <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
        <!--[if lt IE 9]>
            <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
            <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
        <![endif]-->

        <script>
          globalTracimLang = 'fr_FR'
        </script>
    </head>

    <body class="${self.body_class()}">
        <script src="${tg.url('/javascript/jquery.js')}"></script>
        <script src="${tg.url('/javascript/tracim.js')}"></script>

        <div class="container-fluid" style="border: 1px solid #F00;">
            ${self.main_menu()}
            ${self.content_wrapper()}
            ${self.footer()}
        </div>

        <link href="${tg.url('/css/external/google-code-prettify/prettify.css')}" rel="stylesheet">

        <script src="${tg.url('/assets/js/bootstrap.min.js')}"></script>
        <script src="${tg.url('/javascript/external/jquery.hotkeys.js')}"></script>
        <script src="${tg.url('/javascript/external/google-code-prettify/prettify.js')}"></script>
        <script src="${tg.url('/javascript/external/bootstrap-wysiwyg.js')}"></script>
        <script src="/javascript/external/bootstrap-datetimepicker.min.js"></script>
        <script src="${tg.url('/assets/js/trad.js')}"></script>
        <script src="${tg.url('/assets/js/main.js')}"></script>
        ${CFG.TRACKER_JS_CONTENT|n}
    </body>

<%def name="content_wrapper()">
    <% flash=tg.flash_obj.render('flash', use_js=False) %>
    % if flash:
        <div class="row">
            <div class="col-sm-11">
                <div class="alert alert-info" style="margin-top: 1em;">
                    <button type="button" class="close" data-dismiss="alert">&times;</button>
                    ${flash|n}
                </div>
            </div>
        </div>

    % endif
    ${self.body()}
</%def>

<%def name="body_class()"></%def>

<%def name="meta()">
    <meta charset="${response.charset}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</%def>

<%def name="title()">  </%def>

<%def name="footer()">
    <div class="footer hidden-tablet hidden-phone text-center">
        <p class="pod-blue">
            <i>pod &mdash; ${_("collaborate today, capitalize for tomorrow")}</i>

        </p>
        <hr style="width: 50%; margin: 0.5em auto;"/>
        <p>Copyright &copy; 2013 - ${h.current_year()} pod project.</p>
    </div>
</%def>


<%def name="main_menu()">
    <div class="navbar navbar-fixed-top" role="navigation">
        <div class="container-fluid">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target=".navbar-collapse">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand" href="#">
                  <img src="${tg.url('/assets/img/logo.png')}" class="pull-left" style="border: 1px solid #F5F5F5; height: 48px; margin: -13px 0.5em 0 0;"/>
                </a>
            </div>
            <div class="navbar-collapse collapse">
                <ul class="nav navbar-nav navbar-left">
                    <li><a href="${tg.url('/dashboard')}">${TIM.ICO(16, 'places/user-desktop')} ${_('Dashboard')}</a></li>
                    <li><a href="${tg.url('/workspaces')}">${TIM.ICO(16, 'places/folder-remote')} ${_('Workspace')}</a></li>

                    <li class="dropdown">
                      <a href="#" class="dropdown-toggle" data-toggle="dropdown">${TIM.ICO(16, 'categories/preferences-system')} ${_('Admin')} <b class="caret"></b></a>
                      <ul class="dropdown-menu">
                        <li><a href="${tg.url('/users')}">${TIM.ICO(16, 'apps/system-users')} ${_('Users')}</a></li>
                        <li><a href="${tg.url('/workspaces')}">${TIM.ICO(16, 'places/folder-remote')} ${_('Workspaces')}</a></li>
                        <li class="divider" role="presentation"></li>
                        <li><a href="${tg.url('/configuration')}">${TIM.ICO(16, 'categories/preferences-system')} ${_('Global configuration')}</a></li>
                      </ul>
                    </li>

                    <li class="dropdown">




                      <a href="#" class="dropdown-toggle" data-toggle="dropdown">${TIM.ICO(16, 'categories/applications-system')} Debug <b class="caret"></b></a>
                      <ul class="dropdown-menu">
                        <li><a href="${tg.url('/debug/environ')}">${TIM.ICO(16, 'apps/internet-web-browser')} request.environ</a></li>
                        <li><a href="${tg.url('/debug/identity')}">${TIM.ICO(16, 'actions/contact-new')} request.identity</a></li>
                        <li class="divider" role="presentation"></li>
                        <li><a href="${tg.url('/debug/iconset-fa')}">${TIM.ICO(16, 'mimetypes/image-x-generic')} Icon set - Font Awesome</a></li>
                        <li><a href="${tg.url('/debug/iconset-tango')}">${TIM.ICO(16, 'mimetypes/image-x-generic')} Icon set - Tango Icons</a></li>
                      </ul>
                    </li>
                </ul>


                <ul class="nav navbar-nav navbar-right">

                    % if request.identity:
                        <li class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                              ${request.identity['user'].display_name}
                            </a>
                            <ul class="dropdown-menu pull-right">
                                <li>
                                  <a href="${tg.url('/me')}">${TIM.ICO(16, 'actions/contact-new')|n} ${_('My account')}</a>
                                </li>
                                <li class="divider" role="presentation"></li>
                                <li>
                                  <a href="${tg.url('/logout_handler')}">
                                  ${TIM.ICO(16, 'status/status-locked')|n} ${_('Logout')}</a>
                                </li>
                            </ul>
                        </li>
                    % endif

                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                            ${TIM.ICO(16, 'apps/help-browser')}
                        </a>
                        <ul class="dropdown-menu pull-right">
                            <li><a href="${tg.url('/help')}">${TIM.ICO(16, 'apps/help-browser')|n} ${_('Get help')}</a></li>
                            <li><a href="${tg.url('/about')}">${TIM.ICO(16, 'actions/contact-new')|n} ${_('About pod')}</a></li>
                            <li class="divider" role="presentation"></li>
                            <li><a>${_('You are using pod v')}${h.PodVersion()}</a></li>
                        </ul>
                    </li>
                </ul>

                <form class="navbar-form navbar-right" action="${tg.url('/search')}">
                    <input type="text" name="keywords" class="form-control" placeholder="${_('Search...')}" value="${context.get('search_string', '')}">
                    <button type="submit" class="btn btn-default">
                        ${TIM.ICO(16, 'actions/system-search')}
                    </button>
                </form>
            </div>
        </div>
    </div>
</%def>

</html>
