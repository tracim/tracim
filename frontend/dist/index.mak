<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, user-scalable=no'>
    <title>Tracim</title>
    <link rel='shortcut icon' type='image/x-icon' href='/assets/favicon.ico' >

    <link rel='stylesheet' type='text/css' href='/assets/font/font-awesome-4.7.0/css/font-awesome.css'>
    <!--
    <link href='https://fonts.googleapis.com/css?family=Quicksand:300,400,500,700' rel='stylesheet'>
    <link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css' integrity='sha384-/Y6pD6FV/Vv2HJnA6t+vslU6fwYXjCFtcEpHbNJ0lyAFsXTsjBbfaDjzALeQsN6M' crossorigin='anonymous'>
    -->
    <link rel='stylesheet' type='text/css' href='/assets/bootstrap/bootstrap-4.0.0-beta.css'>

    <style>
      <%
        primary = colors['primary']
        # color web string value
        primary_color_str = primary.web
        primary_color_darken_str = primary.darken.web
        primary_color_lighten_str = primary.lighten.web

        html_class = '.primaryColorFont{state}'
        param = 'color'
        color_change_value = 15
      %>
      ${html_class.replace('{state}', '')} { ${param}: ${primary_color_str}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary_color_lighten_str}; }
      <% html_class = '.primaryColorFont{state}Hover:hover' %>
      ${html_class.replace('{state}', '')} { ${param}: ${primary}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary_color_lighten_str}; }

      <%
        html_class = '.primaryColorBg{state}'
        param = 'background-color'
      %>
      ${html_class.replace('{state}', '')} { ${param}: ${primary_color_str}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary_color_lighten_str}; }
      <% html_class = '.primaryColorBg{state}Hover:hover'%>
      ${html_class.replace('{state}', '')} { ${param}: ${primary}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary_color_lighten_str}; }

      <%
        param = 'border-color'
        html_class = '.primaryColorBorder{state}'
      %>
      ${html_class.replace('{state}', '')} { ${param}: ${primary_color_str}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary_color_lighten_str}; }
      <% html_class = '.primaryColorBorder{state}Hover:hover' %>
      ${html_class.replace('{state}', '')} { ${param}: ${primary_color_str}; }
      ${html_class.replace('{state}', 'Darken')} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace('{state}', 'Lighten')} { ${param}: ${primary_color_lighten_str}; }
    </style>

    <style>
      @font-face {
        font-family: 'Quicksand';
        src: url('/assets/font/Quicksand/Quicksand-Regular.ttf');
      }

      body {
        font-family: 'Quicksand';
      }
    </style>

    <script type='text/javascript'>
      GLOBAL_primaryColor = '${primary_color_str}'
    </script>
  </head>

  <body>
    <div id='content'></div>

    <script type='text/javascript' src='/app/tracim_frontend_lib.style.js'></script>

    <script type='text/javascript' src='/assets/tracim/appInterface.js'></script>
    <script type='text/javascript' src='/assets/tracim/tinymceInit.js'></script>

    <script type='text/javascript' src='/assets/tracim.vendor.bundle.js'></script>
    <script type='text/javascript' src='/assets/tracim.app.entry.js'></script>

    <script type='text/javascript' src='/app/workspace.app.js'></script>
    % for app in applications:
    <script type='text/javascript' src='/app/${app.minislug}.app.js'></script>
    %endfor
    <script type='text/javascript' src='/app/admin_workspace_user.app.js'></script>
    <script type='text/javascript' src='/app/workspace_advanced.app.js'></script>

    <script type='text/javascript' src='/assets/bootstrap/jquery-3.2.1.js'></script>
    <script type='text/javascript' src='/assets/bootstrap/popper-1.12.3.js'></script>
    <script type='text/javascript' src='/assets/bootstrap/bootstrap-4.0.0-beta.2.js'></script>

    <script type='text/javascript' src='/assets/tinymce/js/tinymce/jquery.tinymce.min.js'></script>
    <script type='text/javascript' src='/assets/tinymce/js/tinymce/tinymce.min.js'></script>
  </body>
</html>
