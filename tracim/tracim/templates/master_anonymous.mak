<%namespace name="TIM" file="tracim.templates.pod"/>
<!DOCTYPE html>
<html style="height: 100%;">
    <head>
	    ${self.meta()}
        <meta charset="utf-8">
	    <title>${self.title()}</title>
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="">
        <meta name="author" content="">
        <link rel="icon" href="/favicon.ico">

        <link href="${tg.url('/assets/dist/all.css')}" rel="stylesheet">

        <script>
          globalTracimLang = 'fr_FR'
        </script>
    </head>

    <body class="${self.body_class()}" style="
    height: 100%;
    background: url(${CFG.WEBSITE_HOME_BACKGROUND_IMAGE_URL}) no-repeat center bottom scroll;
    -webkit-background-size: cover;
    -moz-background-size: cover;
    background-size: cover;
    -o-background-size: cover;">
        <script src="${tg.url('/assets/js/jquery.min.js')}"></script>

        <div class="container-fluid">
            ${self.main_menu()}
            ${self.content_wrapper()}
            <div id="tracim-footer-separator hidden-xs"></div>
        </div>
        ${self.footer()}

        <script src="${tg.url('/assets/dist/all.js')}"></script>
        ## HACK - D.A. - 2014-10-21
        ##
        ## The following JS "hack" is intended to make TG2 flash messages compatible with bootstrap alert classes
        ## This should disappear as soon as LESS is implemented in the application
        ## meaning we'll define a alert-ok style inheriting from alert-info, etc
        <script>
            $( document ).ready(function() {
                $('.alert-ok').removeClass('alert-ok').addClass('alert-info');
                $('.alert-error').removeClass('alert-error').addClass('alert-danger');
            });
        </script>

        ${CFG.TRACKER_JS_CONTENT|n}
    </body>

<%def name="content_wrapper()">
    ${TIM.FLASH_MSG('')}
    ${self.body()}
</%def>

<%def name="body_class()"></%def>

<%def name="meta()">
    <meta charset="${response.charset}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</%def>

<%def name="title()"></%def>

<%def name="footer()">
    <div class="pod-footer footer hidden-tablet hidden-phone text-center hidden-xs">
        <p>
            <a href="http://trac.im">${_('Create your own collaborative workspace on trac.im')}</a> &mdash;
            copyright &copy; 2013 - ${h.current_year()} tracim project.
        </p>
    </div>
</%def>


<%def name="main_menu()">
    <div class="navbar navbar-fixed-top navbar-fixed-top-transparent" role="navigation">
        <div class="container-fluid">
            <div class="navbar-header">
                <!--button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target=".navbar-collapse">
                    <i class="fa fa-bars"></i>
                </button-->
                <a class="navbar-brand" href="${tg.url('/')}">
                  <img src="${tg.url('/assets/img/logo.png')}" class="pull-left" />
                </a>
            </div>
        </div>
    </div>
</%def>

</html>
