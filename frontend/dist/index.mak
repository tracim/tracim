<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, user-scalable=no'>
    <title>Tracim</title>
    <link rel='shortcut icon' type='image/x-icon' href='/asset/favicon.ico' >

    <link rel='stylesheet' type='text/css' href='/asset/font/font-awesome-4.7.0/css/font-awesome.css'>
    <!--
    <link href='https://fonts.googleapis.com/css?family=Quicksand:300,400,500,700' rel='stylesheet'>
    <link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css' integrity='sha384-/Y6pD6FV/Vv2HJnA6t+vslU6fwYXjCFtcEpHbNJ0lyAFsXTsjBbfaDjzALeQsN6M' crossorigin='anonymous'>
    -->
    <link rel='stylesheet' type='text/css' href='/asset/hamburger/hamburgers.min.css'>
    <link rel='stylesheet' type='text/css' href='/asset/bootstrap/bootstrap-4.0.0-beta.css'>

    <style>
      <%
        primary = colors['primary']
        html_class = '.primaryColorFont{state}'
        param = 'color'
        color_change_value = 15
      %>
      ${html_class.replace('{state}', '')} { ${param}: ${primary.normal}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary.darken}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary.lighten}; }
      <% html_class = '.primaryColorFont{state}Hover:hover' %>
      ${html_class.replace('{state}', '')} { ${param}: ${primary.normal}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary.darken}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary.lighten}; }

      <%
        html_class = '.primaryColorBg{state}'
        param = 'background-color'
      %>
      ${html_class.replace('{state}', '')} { ${param}: ${primary.normal}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary.darken}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary.lighten}; }
      <% html_class = '.primaryColorBg{state}Hover:hover'%>
      ${html_class.replace('{state}', '')} { ${param}: ${primary.normal}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary.darken}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary.lighten}; }

      <%
        param = 'border-color'
        html_class = '.primaryColorBorder{state}'
      %>
      ${html_class.replace('{state}', '')} { ${param}: ${primary.normal}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary.darken}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary.lighten}; }
      <% html_class = '.primaryColorBorder{state}Hover:hover' %>
      ${html_class.replace('{state}', '')} { ${param}: ${primary.normal}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary.darken}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary.lighten}; }
    </style>

    <style>
      @font-face {
        font-family: 'Quicksand';
        src: url('/asset/font/Quicksand/Quicksand-Regular.ttf');
      }

      body {
        font-family: 'Quicksand';
      }
    </style>
  </head>

  <body>
    <div id='content'></div>

    <script type='text/javascript' src='/asset/tracim.vendor.bundle.js'></script>
    <script type='text/javascript' src='/asset/tracim.app.entry.js'></script>

    <script type='text/javascript' src='/app/workspace.app.js'></script>
    % for app in applications:
    <script type='text/javascript' src='/app/${app.minislug}.app.js'></script>
    %endfor
    <script type='text/javascript' src='/app/admin_workspace_user.app.js'></script>
    <script type='text/javascript' src='/app/workspace_advanced.app.js'></script>

    <script type='text/javascript' src='/asset/bootstrap/jquery-3.2.1.js'></script>
    <script type='text/javascript' src='/asset/bootstrap/popper-1.12.3.js'></script>
    <script type='text/javascript' src='/asset/bootstrap/bootstrap-4.0.0-beta.2.js'></script>

    <script type='text/javascript' src='/asset/tinymce/js/tinymce/jquery.tinymce.min.js'></script>
    <script type='text/javascript' src='/asset/tinymce/js/tinymce/tinymce.min.js'></script>

    <script type='text/javascript' src='/asset/tracim/appInterface.js'></script>
    <script type='text/javascript' src='/asset/tracim/tinymceInit.js'></script>
  </body>
</html>
