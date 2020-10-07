<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, user-scalable=no'>

    <title>${website_title}</title>
    <link class="tracim__favicon" rel="icon" type="image/png" sizes="64x64" href="/assets/images/favicon/tracim_64x64.png?token=${cache_token}">
    <link class="tracim__favicon" rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon/tracim_32x32.png?token=${cache_token}">
    <link class="tracim__favicon" rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon/tracim_16x16.png?token=${cache_token}">
    <link rel='manifest' href='/assets/manifest.json?token=${cache_token}'>

    <link rel='stylesheet' type='text/css' href='/assets/font/font-awesome-4.7.0/css/font-awesome.css?token=${cache_token}'>
    <link rel='stylesheet' type='text/css' href='/assets/bootstrap/bootstrap-4.0.0-beta.css?token=${cache_token}'>

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
      <% html_class = '.primaryColorBg{state}Active:active'%>
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
      @font-face {
        font-family: 'Quicksand';
        src: url('/assets/font/Quicksand/Quicksand-Bold.ttf');
        font-weight: bold;
      }

      body {
        font-family: 'Quicksand';
      }
    </style>

    <script type='text/javascript'>
      GLOBAL_primaryColor = '${primary_color_str}'
      GLOBAL_excludedNotifications = '${excluded_notifications}'.replace(/\s/g, '')
    </script>
  </head>

  <body>
    <div id='content'></div>

    <script type='text/javascript' src='/app/tracim_frontend_lib.style.js?token=${cache_token}'></script>

    % for custom_toolbox_file in custom_toolbox_files:
    <script type='text/javascript' src='/custom_toolbox-assets/${custom_toolbox_file.name}?token=${cache_token}'></script>
    % endfor

    <script type='text/javascript' src='/assets/tracim.vendors~app.js?token=${cache_token}'></script>
    <script type='text/javascript' src='/assets/tracim.app.js?token=${cache_token}'></script>

    <script type='text/javascript' src='/app/workspace.app.js?token=${cache_token}'></script>

    % for app in applications:
    <script type='text/javascript' src='/app/${app.minislug}.app.js?token=${cache_token}'></script>
    %endfor
    <script type='text/javascript' src='/app/share_folder.app.js?token=${cache_token}'></script>
    <script type='text/javascript' src='/app/admin_workspace_user.app.js?token=${cache_token}'></script>
    <script type='text/javascript' src='/app/workspace_advanced.app.js?token=${cache_token}'></script>

    <script type='text/javascript' src='/assets/bootstrap/jquery-3.2.1.js?token=${cache_token}'></script>
    <script type='text/javascript' src='/assets/bootstrap/popper-1.12.3.js?token=${cache_token}'></script>
    <script type='text/javascript' src='/assets/bootstrap/bootstrap-4.0.0-beta.2.js?token=${cache_token}'></script>

    <script type='text/javascript' src='/assets/tinymce-4.7.13/js/tinymce/jquery.tinymce.min.js?token=${cache_token}'></script>
    <script type='text/javascript' src='/assets/tinymce-4.7.13/js/tinymce/tinymce.min.js?token=${cache_token}'></script>
  </body>
</html>
