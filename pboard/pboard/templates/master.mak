<%namespace name="POD" file="pboard.templates.pod"/>
<!DOCTYPE html>
<html>
<head>
    ${self.meta()}
    <title>${self.title()}</title>
    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/bootstrap.min.css')}" />
    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/bootstrap-responsive.min.css')}" />
    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/style.css')}" />
    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/glyphicons.css')}" />

    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/bootstrap-datetimepicker.min.css')}" />
    <link rel="stylesheet" type="text/css" media="screen" href="${tg.url('/css/external/font-awesome-4.1.0/css/font-awesome.min.css')}" />
</head>
<body class="${self.body_class()}">
  <script src="${tg.url('/javascript/jquery.js')}"></script>
  <script src="${tg.url('/javascript/pod.js')}"></script>

  <div class="container">
    ${self.main_menu()}
    ${self.content_wrapper()}
    ${self.footer()}
  </div>

  <link href="${tg.url('/css/external/google-code-prettify/prettify.css')}" rel="stylesheet">

  <script src="${tg.url('/javascript/external/bootstrap.min.js')}"></script>
  <script src="${tg.url('/javascript/external/jquery.hotkeys.js')}"></script>
  <script src="${tg.url('/javascript/external/google-code-prettify/prettify.js')}"></script>
  <script src="${tg.url('/javascript/external/bootstrap-wysiwyg.js')}"></script>
  <script src="/javascript/external/bootstrap-datetimepicker.min.js"></script>

</body>

<%def name="content_wrapper()">
  <%
    flash=tg.flash_obj.render('flash', use_js=False)
  %>
  % if flash:
    <div class="row">
      <button type="button" class="close" data-dismiss="alert">&times;</button>
      ${flash | n}
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
      <i>${_("collaborative work  ♦  improved efficiency  ♦  full traceability")}</i>
      <br/>
      this is pod
    </p>
    <hr style="width: 50%; margin: 0.5em auto;"/>
    <p>Copyright &copy; 2013 - ${h.current_year()} pod project.</p>
  </div>
</%def>

<%def name="main_menu()">
  <div id="pod-navbar" class="navbar navbar-fixed-top">
    <div class="navbar-inner">
      <div class="container">
        <div class="nav-collapse">
          <ul class="nav">
            <li class="">
##            ${POD.isCurrentPage('home', page)}
              <a href="${tg.url('/')}">
                <i class="fa fa-home"></i>
                <strong>
                  pod
                </strong>
                <sup class="pod-blue">alpha</sup>
              </a>
            </li>
          % if request.identity:
            <li>
              <a href="${tg.url('/dashboard')}">
                <i class="fa fa-dashboard"></i>
                Dashboard
              </a>
            </li>
            <li>
              <a href="${tg.url('/document')}"><i class="fa fa-file-text-o"></i> ${_('Documents')}</a>
            </li>

            <li title=" ${_('Toggle view mode [narrow, medium, large]')}">
              <a title="${_('Toggle view mode: narrow')}" id='view-size-toggle-button-small' class="pod-do-not-display"><i class='fa fa-eye'></i></a>
              <a title="${_('Toggle view mode: medium')}" id='view-size-toggle-button-medium'><i class='fa fa-eye'></i></a>
              <a title="${_('Toggle view mode: large')}"  id='view-size-toggle-button-large' class="pod-do-not-display"><i class='fa fa-eye'></i></a>
            </li>

##            <li class="dropdown" title="Calculator">
##              <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="icon-g-calculator"></i></a>
##              <ul class="dropdown-menu pull-left">
##                <li class="text-center">
##                  <fieldset>
##                    <legend><i class="icon-g-calculator"></i> Calculator</legend>
##                    <table id='keyboard' style="margin:0.2em;">
##                      <tr>
##                        <td colspan="5">
##                          <input type='text' class="text-right" id='calculation'/><br/>
##                          <input type='text' class="text-right" readonly id='result'/>
##                        </td>
##                      </tr>
##                      <tr>
##                        <td><span class='btn'>7</span></td>
##                        <td><span class='btn'>8</span></td>
##                        <td><span class='btn'>9</span></td>
##                        <td><span class='btn'>(</span></td>
##                        <td><span class='btn'>)</span></td>
##                      </tr>
##                      <tr>
##                        <td><span class='btn'>4</span></td>
##                        <td><span class='btn'>5</span></td>
##                        <td><span class='btn'>6</span></td>
##                        <td><span class='btn'>-</span></td>
##                        <td><span class='btn'>+</span></td>
##                      </tr>
##                      <tr>
##                        <td><span class='btn'>1</span></td>
##                        <td><span class='btn'>2</span></td>
##                        <td><span class='btn'>3</span></td>
##                        <td><span class='btn'>/</span></td>
##                        <td><span class='btn'>*</span></td>
##                      </tr>
##                      <tr>
##                        <td><span class='btn'>.</span></td>
##                        <td><span class='btn'>0</span></td>
##                        <td><span class='btn'>%</span></td>
##                        <td><span class='btn btn-success'>=</span></td>
##                        <td><span class='btn btn-danger'>C</span></td>
##                      </tr>
##                    </table>
##                  </fieldset>
##                  <p></p>
##               </ul>
##            </li>


          % endif

          % if request.identity:
            <li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                <i class="fa fa-cogs"></i>
                Admin <b class="caret"></b>
              </a>
              <ul class="dropdown-menu">
                <li><a href="${tg.url('/admin/users')}"><i class="fa fa-user"></i> ${_('Users')}</a></li>
                <li><a href="${tg.url('/admin/groups')}"><i class="fa fa-group"></i> ${_('Groups')}</a></li>
                % if request.identity and 'managers' in request.identity['groups']:
                  <li class="divider" role="presentation"></li>
                  <li><a href="${tg.url('/admin')}"><i class="fa fa-magic"></i> Manage all</a></li>
                % endif
              </ul>
            </li>
          % endif

          % if request.identity and 'managers' in request.identity['groups']:
            <li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-cogs "></i> Debug <b class="caret"></b></a>
              <ul class="dropdown-menu">
                <li><a href="${tg.url('/debug/iconset')}"><i class="fa fa-picture-o"></i> icon set</a></li>
                <li><a href="${tg.url('/debug/environ')}"><i class="fa fa-globe"></i>     request.environ</a></li>
                <li><a href="${tg.url('/debug/identity')}"><i class="fa fa-user-md"></i>  request.identity</a></li>
              </ul>
            </li>
          % endif

          % if request.identity:
            <li>
              <form class="navbar-search  form-search" action="${tg.url('/search')}">
                <div class="input-append">
                  <input name="keywords" type="text" class="span2 search-query" placeholder="Search" value="${context.get('search_string', '')}">
                  <button title="${_('Search')}" class="btn" type="submit"><i class="fa fa-search"></i></button>
                </div>
              </form>
            </li>

            
            
          % endif
          </ul>
          <ul class="nav pull-right">
            <li title="${_('Help / About')}">
              <a href="${tg.url('/about')}"><i class="fa fa-question-circle"></i></a>
            </li>


            % if request.identity:
              <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-user"></i> ${request.identity['user'].display_name}</a>
                <ul class="dropdown-menu pull-right">
                  <li class="text-center">
                    <fieldset>
                      <legend><i class="fa fa-key"></i> Logout</legend>
                      <a class="btn btn-danger" href="${tg.url('/logout_handler')}">Logout <i class="fa fa-power-off"></i> </a>
                    </fieldset>
                    <p></p>
                 </ul>
              </li>
            % endif
          </ul>

        </div><!-- /.nav-collapse -->
      </div><!-- /.container -->
    </div><!-- /.navbar-inner -->
  </div><!-- /.navbar -->
</%def>


</html>
