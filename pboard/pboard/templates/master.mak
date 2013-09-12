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

    <style>
      /* Wrapper for page content to push down footer */
      #wrap {
        min-height: 100%;
        height: auto !important;
        height: 100%;
        /* Negative indent footer by it's height */
        margin: 0 auto -60px;
      }

      /* Set the fixed height of the footer here */
      #push,
      #footer {
        height: 60px;
      }
      #footer {
        background-color: #f5f5f5;
      }

      /* Lastly, apply responsive CSS fixes as necessary */
      @media (max-width: 767px) {
        #footer {
          margin-left: -20px;
          margin-right: -20px;
          padding-left: 20px;
          padding-right: 20px;
        }
      }
      

div.pod-toolbar {
  visibility: hidden;
  position: absolute;
  right: 1.2em;
  top: 0;
}

.pod-toolbar-parent {
  border-bottom: 1px dotted #CCC;
}
.pod-toolbar-parent:Hover {
  background-color: #EFEFEF;
}
.pod-toolbar-parent:Hover > div.pod-toolbar {
  visibility: visible;
}
.pod-status {
  position: absolute;
  width: 1.2em;
  text-align: center;
  right: 0;
  top: 0;
}

h3:Hover div.pod-toolbar {
  visibility: visible;
}

body { padding-top: 60px; }
@media screen and (max-width: 768px) {
    body { padding-top: 0px; }
}

    </style>
</head>
<body class="${self.body_class()}">

  <div class="container">
    ${self.main_menu()}
    ${self.content_wrapper()}
    ${self.footer()}
  </div>

  <script src="http://code.jquery.com/jquery.js"></script>
  <script src="${tg.url('/javascript/bootstrap.min.js')}"></script>

<!-- WYSIWYG Text editor -->
<link rel="stylesheet" type="text/css" href="/bootstrap-wysihtml5-0.0.2/bootstrap-wysihtml5-0.0.2.css"></link>
<!--link rel="stylesheet" type="text/css" href="/bootstrap-wysihtml5-0.0.2/libs/css/bootstrap.min.css"></link-->

<script src="/bootstrap-wysihtml5-0.0.2/libs/js/wysihtml5-0.3.0_rc2.js"></script>
<script src="/bootstrap-wysihtml5-0.0.2/bootstrap-wysihtml5-0.0.2.js"></script>
<script src="/javascript/bootstrap-datetimepicker.min.js"></script>

<style>
tr:Hover td div.pod-toolbar {
  visibility: hidden;
}
tr:Hover td div.pod-toolbar {
  visibility: visible;
}

.pod-status-grey-light  { background-color: #DDD; }
.pod-status-grey-middle { background-color: #BBB; }
.pod-status-grey-dark   { background-color: #AAA; }

</style>

  
            <script>
            $('#create_document_save_button').on('click', function(e){
              // We don't want this to act as a link so cancel the link action
              e.preventDefault();

              // Find form and submit it
              $('#create_document_form').submit();
            });
            </script>

            <script>
              $(document).ready(function() {

                
                $('#current_node_textarea').wysihtml5({
                  "font-styles": true, //Font styling, e.g. h1, h2, etc. Default true
                  "emphasis": true, //Italics, bold, etc. Default true
                  "lists": true, //(Un)ordered lists, e.g. Bullets, Numbers. Default true
                  "html": true, //Button which allows you to edit the generated HTML. Default false
                  "link": false, //Button to insert a link. Default true
                  "image": false, //Button to insert an image. Default true,
                  // "color": true //Button to change color of font  
                });
                $('#current_node_textarea').css('margin-bottom', '0');
                $('#current_node_textarea').css("min-height", "12em");
                $('#current_node_textarea').addClass("span5");


                /* Edit title form */
                $("#current-document-title-edit-form" ).css("display", "none");
                $("#current-document-title" ).dblclick(function() {
                  $("#current-document-title" ).css("display", "none");
                  $("#current-document-title-edit-form" ).css("display", "block");
                });
                $("#current-document-title-edit-cancel-button" ).click(function() {
                  $("#current-document-title" ).css("display", "block");
                  $("#current-document-title-edit-form" ).css("display", "none");
                });
                $('#current-document-title-save-cancel-button').on('click', function(e){
                  // We don't want this to act as a link so cancel the link action
                  e.preventDefault();
                  $('#current-document-title-edit-form').submit();
                });

                /* Edit content form */
                $("#current-document-content-edit-form" ).css("display", "none");
                $("#current-document-content-edit-button" ).click(function() {
                  $("#current-document-content" ).css("display", "none");
                  $("#current-document-content-edit-form" ).css("display", "block");
                });
                $("#current-document-content" ).dblclick(function() {
                  $("#current-document-content" ).css("display", "none");
                  $("#current-document-content-edit-form" ).css("display", "block");
                });
                $("#current-document-content-edit-cancel-button" ).click(function() {
                  $("#current-document-content" ).css("display", "block");
                  $("#current-document-content-edit-form" ).css("display", "none");
                });
                $('#current-document-content-edit-save-button').on('click', function(e){
                  // We don't want this to act as a link so cancel the link action
                  e.preventDefault();
                  $('#current-document-content-edit-form').submit();
                });


                /* Add event form hide/show behavior */
                $("#current-document-add-event-button" ).click(function() {
                  $("#current-document-add-event-form" ).css("display", "block");
                  $("#current-document-add-event-button" ).css("display", "none");
                });
                $('#current-document-add-event-cancel-button').on('click', function(e){
                  $("#current-document-add-event-form" ).css("display", "none");
                  $("#current-document-add-event-button" ).css("display", "block");
                });
                $('#current-document-add-event-save-button').on('click', function(e){
                  e.preventDefault(); // We don't want this to act as a link so cancel the link action
                  $('#current-document-add-event-form').submit();
                });




/*                $('.date-picker-input').datepicker({
                  format: 'mm-dd-yyyy'
                });
*/
                $(function() {
                  $('.datetime-picker-input-div').datetimepicker({
                    language: 'fr-FR',
                    pickSeconds: false
                  });
                });

              });
              
            </script>
</body>

<%def name="content_wrapper()">
  <%
    flash=tg.flash_obj.render('flash', use_js=False)
  %>
  % if flash:
    <div class="row"><div class="span8 offset2">
      ${flash | n}
    </div></div>
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
  <div class="footer hidden-tablet hidden-phone">
    <p>Copyright &copy; pod project ${h.current_year()}</p>
  </div>
</%def>

<%def name="main_menu()">
  <div id="pod-navbar" class="navbar navbar-fixed-top">
    <div class="navbar-inner">
      <div class="container">
        <a class="brand" href="#"><!--img src="${tg.url('/img/turbogears_logo.png')}" alt="TurboGears 2"/--> <strong>pod</strong></a>
        <div class="nav-collapse">
          <ul class="nav">
            <li class="active"><a href="${tg.url('/dashboard')}"><i class="icon-home icon-white"></i> Dashboard</a></li>
            <li><a href="#">Link</a></li>
            <li><a href="#">Link</a></li>
            <li><a href="#">Link</a></li>
          % if request.identity:
            <li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown">Admin <b class="caret"></b></a>
              <ul class="dropdown-menu">
                <li class="${('', 'active')[page=='admin']}"><a href="${tg.url('/admin')}">Manage</a></li>
                <li class="${('', 'active')[page=='about']}"><a href="${tg.url('/about')}">About</a></li>
                <li class="${('', 'active')[page=='data']}"><a href="${tg.url('/data')}">Serving Data</a></li>
                <li class="${('', 'active')[page=='environ']}"><a href="${tg.url('/environ')}">WSGI Environment</a></li>
              </ul>
            </li>
          % endif
          </ul>
          <ul class="nav pull-right">
            % if not request.identity:
              <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="icon-user"></i> Login</a>
                <ul class="dropdown-menu pull-right">
                  <li class="text-center">
                    <form action="${tg.url('/login_handler')}">
                      <fieldset>
                        <legend>Sign in</legend>
                      <input class="span2" type="text" id="login" name="login" placeholder="email...">
                      <input class="span2" type="password" id="password" name="password" placeholder="password...">
                      <div class="span2 control-group">
                        Remember me <input type="checkbox" id="loginremember" name="remember" value="2252000"/>
                      </div>
                      <input type="submit" id="submit" value="Login" />
                      </fieldset>
                    </form>
                   <li class="divider"></li>
                   <li><a href="">Register</a></li>
                 </ul>
              </li>
            % else:
              <li>
                <a href="${tg.url('/logout_handler')}"><i class="icon-off"></i> Logout</a>
              </li>
            % endif
          </ul>

          <form class="navbar-search pull-right" action="">
            <input type="text" class="search-query span2" placeholder="Search">
          </form>
        </div><!-- /.nav-collapse -->
      </div><!-- /.container -->
    </div><!-- /.navbar-inner -->
  </div><!-- /.navbar -->
</%def>


</html>
