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
        <link rel="icon" href="../../favicon.ico">
        <link href="${tg.url('/assets/css/bootstrap.min.css')}" rel="stylesheet">
        <link href="${tg.url('/assets/css/dashboard.css')}" rel="stylesheet">
        <link href="${tg.url('/assets/font-awesome-4.2.0/css/font-awesome.css')}" rel="stylesheet">
    </head>

    <body class="${self.body_class()}">
        <script src="${tg.url('/assets/js/jquery.min.js')}"></script>

        <div class="container-fluid">
            ${self.main_menu()}
            ${self.content_wrapper()}
            <div id="tracim-footer-separator"></div>
        </div>
        ${self.footer()}

        <script src="${tg.url('/assets/js/bootstrap.min.js')}"></script>
        ${h.tracker_js()|n}
    </body>

<%def name="content_wrapper()">
    ${TIM.FLASH_MSG('col-sm-11')}
    ${self.body()}
</%def>

<%def name="body_class()"></%def>

<%def name="meta()">
    <meta charset="${response.charset}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</%def>

<%def name="title()">  </%def>

<%def name="footer()">
    <div class="pod-footer footer hidden-tablet hidden-phone text-center">
        <p>
            <a href="http://trac.im">${_('Create your own collaborative workspace on trac.im')}</a> &mdash;
            copyright &copy; 2013 - ${h.current_year()} tracim project.
        </p>
    </div>
    
    <script type="text/javascript">
        $(function () {
            $("[rel='tooltip']").tooltip();
        });
    </script>
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
                <a class="navbar-brand" href="${tg.url('/')}">
##                  <img src="${tg.url('/assets/img/tracim.png')}" class="pull-left" style="border: 1px solid #F5F5F5; height: 48px; margin: -13px 0.5em 0 0;"/>
                  <img src="${tg.url('/assets/img/logo.png')}" class="pull-left" style="height: 48px; margin: -13px 0.5em 0 -13px;"/>
                </a>
            </div>
            <div class="navbar-collapse collapse">
                % if request.identity:
                    <ul class="nav navbar-nav navbar-left">
                        <li><a href="${tg.url('/dashboard')}">${TIM.ICO(16, 'places/user-desktop')} ${_('Dashboard')}</a></li>
                        <li><a href="${tg.url('/workspaces')}">${TIM.ICO(16, 'places/folder-remote')} ${_('Workspace')}</a></li>

                        % if fake_api.current_user.profile.id>=2:
                            <li class="dropdown">
                              <a href="#" class="dropdown-toggle" data-toggle="dropdown">${TIM.ICO(16, 'categories/preferences-system')} ${_('Admin')} <b class="caret"></b></a>
                              <ul class="dropdown-menu">
                                <li><a href="${tg.url('/admin/users')}">${TIM.ICO(16, 'apps/system-users')} ${_('Users')}</a></li>
                                <li><a href="${tg.url('/admin/workspaces')}">${TIM.ICO(16, 'places/folder-remote')} ${_('Workspaces')}</a></li>
## TODO - D.A. - 2014-10-20 - Restore global configuration screen
##                                <li class="divider" role="presentation"></li>
##                                <li><a href="${tg.url('/admin/configuration')}">${TIM.ICO(16, 'categories/preferences-system')} ${_('Global configuration')}</a></li>
                              </ul>
                            </li>
                        % endif

                        % if h.is_debug_mode():
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
                        % endif
                    </ul>
                % endif

                <ul class="nav navbar-nav navbar-right">

                    % if request.identity:
## TODO - D.A. - 2014-10-19 - RESTORE SEARCH FEATURE
##                        <li>
##                            <form class="navbar-form navbar-right" action="${tg.url('/search')}">
##                                <input type="text" name="keywords" class="form-control" placeholder="${_('Search...')}" value="${context.get('search_string', '')}">
##                                <button type="submit" class="btn btn-default">
##                                    ${TIM.ICO(16, 'actions/system-search')}
##                                </button>
##                            </form>
##                        </li>
                        <li class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                              ${TIM.ICO(16, 'categories/applications-system')} ${request.identity['user'].display_name}
                            </a>
                            <ul class="dropdown-menu pull-right">
                                <li>
                                  <a href="${tg.url('/user/me')}">${TIM.ICO(16, 'actions/contact-new')|n} ${_('My account')}</a>
                                </li>
                                <li class="divider" role="presentation"></li>
                                <li>
                                  <a href="${tg.url('/logout_handler')}">
                                  ${TIM.ICO(16, 'status/status-locked')|n} ${_('Logout')}</a>
                                </li>
                            </ul>
                        </li>
                    % else:
                        <li><a href="${tg.url('/')}">${TIM.ICO(16, 'status/status-unlocked')} ${_('Login')}</a></li>
                    % endif

## TODO - D.A. - 2014-10-19 - RESTORE HELP LINKS
##                    <li class="dropdown">
##                        <a href="#" class="dropdown-toggle" data-toggle="dropdown">
##                            ${TIM.ICO(16, 'apps/help-browser')}
##                        </a>
##                        <ul class="dropdown-menu pull-right">
##                            <li><a href="${tg.url('/help')}">${TIM.ICO(16, 'apps/help-browser')|n} ${_('Get help')}</a></li>
##                            <li><a href="${tg.url('/about')}">${TIM.ICO(16, 'actions/contact-new')|n} ${_('About pod')}</a></li>
##                            <li class="divider" role="presentation"></li>
##                            <li><a>${_('You are using pod v')}${h.PodVersion()}</a></li>
##                        </ul>
##                    </li>
                </ul>
            </div>
        </div>
    </div>
</%def>

</html>
