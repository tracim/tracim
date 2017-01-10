<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="NAVBAR_MENU" file="tracim.templates.widgets.navbar_menu"/>
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
        <link href="${tg.url('/assets/css/bootstrap.min.css')}" rel="stylesheet">
        <link href="${tg.url('/assets/css/dashboard.css')}" rel="stylesheet">
        <link href="${tg.url('/assets/font-awesome-4.2.0/css/font-awesome.css')}" rel="stylesheet">
        <link href="${tg.url('/assets/select2-4.0.3/css/select2.min.css')}" rel="stylesheet">

        <script>
            var shiftWindow = function() { scrollBy(0, -50) };
            window.addEventListener("hashchange", shiftWindow);
            function load() { if (window.location.hash) shiftWindow(); }

            globalTracimLang = 'fr_FR'
        </script>
    </head>

    <body class="${self.body_class()}">
        <script src="${tg.url('/assets/js/jquery.min.js')}"></script>

        <div class="${container_classes()}">
            ${self.main_menu()}
            ${self.content_wrapper()}
            <div id="tracim-footer-separator"></div>
        </div>
        ${self.footer()}

        <script src="${tg.url('/assets/select2-4.0.3/js/select2.min.js')}"></script>
        <script src="${tg.url('/assets/js/bootstrap.min.js')}"></script>
        <script src="${tg.url('/assets/js/main.js')}"></script>
        ${CFG.TRACKER_JS_CONTENT|n}
    </body>


<%def name="container_classes()"></%def>

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
        ${TIM.FLASH_MSG('')}
##
##         <div class="row" id="flashgordon">
##             <div class="col-sm-7 col-sm-offset-3" style="z-index: 10001; padding: 0; position: absolute; top: 0;">
##                 <div class="alert alert-info" style="margin-top: 1em; ">
##                     <button type="button" class="close" data-dismiss="alert">×</button>
##                     <div id="flash">
##                         <img src="/assets/icons/32x32/status/flash-ok.png">
##                         Statut de Fichier mis(e) à jour
##                     </div>
##                 </div>
##
##                 <script>
##                     window.setTimeout(function() {
##                         $("#flashgordon").fadeTo(5000, 0.5);
##                     }, 5000);
##                 </script>
##             </div>
##         </div>



        <div class="">
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

            <div class="header__navbar navbar-collapse collapse">
                % if request.identity:
                    <ul class="header__navbar__list nav navbar-nav navbar-left">
                        <li class="header__navbar__list__item active">
                            <a href="${tg.url('/home')}">${TIM.FA('fa-home fa-lg')} ${_('My Home')}</a>
                        </li>
                        <li class="header__navbar__list__item">
                            <a href="${tg.url('/calendar')}">${TIM.FA('fa-calendar')} ${_('Calendar')}</a>
                        </li>
                        ${NAVBAR_MENU.ADMIN_ITEMS()}
                    </ul>
                % endif

                <ul class="header__navbar__right nav navbar-nav navbar-right">

                    % if request.identity:

                        <form id="search-form" class="navbar-form navbar-left" role="search" action="${tg.url('/search?')}">
                            <div class="form-group">
                                <input type="text" class="form-control" placeholder="${_('Search for...')}" name="keywords" value="${','.join(search.keywords) if search else ''}">
                                <i class="fa fa-search t-less-visible" style="margin-left: -2em;" onclick="$('#search-form').submit()"></i>
                            </div>
                            ## <button type="submit" class="btn btn-default">${_('Search')}</button>
                        </form>

                        % if fake_api.current_user.profile.id>=8: #2:
                            <li class="dropdown">
                              <a href="#" class="dropdown-toggle" data-toggle="dropdown">${TIM.FA('fa-lg fa-cogs')} ${_('Admin')} <b class="caret"></b></a>
                              <ul class="dropdown-menu">
                                <li><a href="${tg.url('/admin/users')}">${TIM.FA('fa-users tracim-less-visible')} ${_('Users')}</a></li>
                                <li><a href="${tg.url('/admin/workspaces')}">${TIM.FA('fa-bank tracim-less-visible')} ${_('Workspaces')}</a></li>
## TODO - D.A. - 2014-10-20 - Restore global configuration screen
##                                <li class="divider" role="presentation"></li>
##                                <li><a href="${tg.url('/admin/configuration')}">${TIM.ICO(16, 'categories/preferences-system')} ${_('Global configuration')}</a></li>
                              </ul>
                            </li>
                        % endif

                        % if False and h.is_debug_mode():
                            <li class="dropdown text-danger" >
                                <a href="#" class="dropdown-toggle" data-toggle="dropdown">${TIM.FA('fa-warning t-orange')} Debug <b class="caret"></b></a>
                                <ul class="dropdown-menu">
                                    <li><a class="text-danger" href=""><strong>${_('you MUST desactivate debug in production')}</strong></a></li>
                                    <li class="divider" role="presentation"></li>
                                    <li><a href="${tg.url('/debug/environ')}">${TIM.FA('fa-globe fa-fw t-less-visible')} request.environ</a></li>
                                    <li><a href="${tg.url('/debug/identity')}">${TIM.FA('fa-user fa-fw t-less-visible')} request.identity</a></li>
                                    <li class="divider" role="presentation"></li>
                                    <li><a href="${tg.url('/debug/iconset-fa')}">${TIM.FA('fa-file-image-o t-less-visible')} Icon set - Font Awesome</a></li>
                                    <li><a href="${tg.url('/debug/iconset-tango')}">${TIM.FA('fa-file-image-o t-less-visible')} Icon set - Tango Icons</a></li>
                                </ul>
                            </li>
                        % endif
                        <li class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                                ${TIM.FA('fa-lg fa-user')} ${fake_api.current_user.name}

                            </a>
                            <ul class="dropdown-menu pull-right">
                                <li>
                                  <a href="${tg.url('/logout_handler')}">${TIM.FA('fa-sign-out fa-fw t-orange')} ${_('Logout')}</a>
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

                <div class="header__navbar__switch-mode switch-read-mode">
                    ${TIM.FA('fa-eye')} ${_('Read mode')}
                </div>

            </div>
        </div>
    </div>
</%def>
</html>
