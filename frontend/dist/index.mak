<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, user-scalable=no'>

    <title>${website_title}</title>
    <link rel="icon" type="image/png" sizes="64x64" href="/assets/images/favicon/tracim_64x64.png?v=${build_version}">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon/tracim_32x32.png?v=${build_version}">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon/tracim_16x16.png?v=${build_version}">
    <link rel='manifest' href='/assets/manifest.json?v=${build_version}'>

    <link rel='stylesheet' type='text/css' href='/assets/font/font-awesome-4.7.0/css/font-awesome.css?v=${build_version}'>
    <link rel='stylesheet' type='text/css' href='/assets/bootstrap/bootstrap-4.0.0-beta.css?v=${build_version}'>

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

    <script type='text/javascript' src='/app/tracim_frontend_lib.style.js?v=${build_version}'></script>

    <script type='text/javascript' src='/assets/tracim/appInterface.js?v=${build_version}'></script>
    <script type='text/javascript' src='/assets/tracim/tinymceInit.js?v=${build_version}'></script>

    % for custom_toolbox_file in custom_toolbox_files:
    <script type='text/javascript' src='/custom_toolbox-assets/${custom_toolbox_file.name}?v=${build_version}'></script>
    % endfor

    <script type='text/javascript' src='/assets/tracim.vendors~app.js?v=${build_version}'></script>
    <script type='text/javascript' src='/assets/tracim.app.js?v=${build_version}'></script>

    <script type='text/javascript' src='/app/workspace.app.js?v=${build_version}'></script>

    % for app in applications:
    <script type='text/javascript' src='/app/${app.minislug}.app.js?v=${build_version}'></script>
    %endfor
    <script type='text/javascript' src='/app/share_folder.app.js?v=${build_version}'></script>
    <script type='text/javascript' src='/app/admin_workspace_user.app.js?v=${build_version}'></script>
    <script type='text/javascript' src='/app/workspace_advanced.app.js?v=${build_version}'></script>
    <script type='text/javascript' src='/app/gallery.app.js?v=${build_version}'></script>

    <script type='text/javascript' src='/assets/bootstrap/jquery-3.2.1.js?v=${build_version}'></script>
    <script type='text/javascript' src='/assets/bootstrap/popper-1.12.3.js?v=${build_version}'></script>
    <script type='text/javascript' src='/assets/bootstrap/bootstrap-4.0.0-beta.2.js?v=${build_version}'></script>

    <script type='text/javascript' src='/assets/tinymce/js/tinymce/jquery.tinymce.min.js?v=${build_version}'></script>
    <script type='text/javascript' src='/assets/tinymce/js/tinymce/tinymce.min.js?v=${build_version}'></script>
  </body>
</html>
