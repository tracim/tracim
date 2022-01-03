<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, user-scalable=no" />
    % if website_description:
    <meta name="description" content="${website_description}" />
    % endif
    <title>${website_title}</title>
    <link class="tracim__favicon" rel="icon" type="image/png" sizes="64x64" href="/assets/branding/images/favicon/tracim-64x64.png?token=${cache_token}" nonce="${csp_nonce}">
    <link class="tracim__favicon" rel="icon" type="image/png" sizes="32x32" href="/assets/branding/images/favicon/tracim-32x32.png?token=${cache_token}" nonce="${csp_nonce}">
    <link class="tracim__favicon" rel="icon" type="image/png" sizes="16x16" href="/assets/branding/images/favicon/tracim-16x16.png?token=${cache_token}" nonce="${csp_nonce}">
    <link rel="manifest" href="/assets/branding/manifest.json?token=${cache_token}" nonce="${csp_nonce}">

    <link rel="stylesheet" type="text/css" href="/assets/font/fontawesome-free-5.15.2-web/css/all.css?token=${cache_token}" nonce="${csp_nonce}">
    <link rel="stylesheet" type="text/css" href="/assets/font/fontawesome-free-5.15.2-web/css/regular.css?token=${cache_token}" nonce="${csp_nonce}">

    <link rel="stylesheet" type="text/css" href="/assets/bootstrap/bootstrap-4.0.0-beta.css?token=${cache_token}" nonce="${csp_nonce}">
    <link rel="stylesheet" type="text/css" href="/assets/branding/${website__welcome_page_style}?token=${cache_token}" nonce="${csp_nonce}">

    <!-- Apple icons -->
    <link rel="apple-touch-icon" href="/assets/branding/images/wa-tracim-logo-180x180.png">
    <link rel="mask-icon" href="/assets/images/branding/safari-pinned-tab-icon.svg" color="${colors['primary'].web}">

    <style nonce="${csp_nonce}">
      <%
        primary = colors["primary"]
        # color web string value
        primary_color_str = primary.web
        primary_color_darken_str = primary.darken.web
        primary_color_lighten_str = primary.lighten.web

        html_class = ".primaryColorFont{state}"
        param = "color"
        color_change_value = 15
      %>

      ${html_class.replace("{state}", "")} { ${param}: ${primary_color_str}; }
      ${html_class.replace("{state}", "Darken")} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace("{state}", "Lighten")} { ${param}: ${primary_color_lighten_str}; }
      <% html_class = ".primaryColorFont{state}Hover:hover" %>
      ${html_class.replace("{state}", "")} { ${param}: ${primary}; }
      ${html_class.replace("{state}", "Darken")} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace("{state}", "Lighten")} { ${param}: ${primary_color_lighten_str}; }

      <%
        html_class = ".primaryColorBg{state}"
        param = "background-color"
      %>
      ${html_class.replace("{state}", "")} { ${param}: ${primary_color_str}; }
      ${html_class.replace("{state}", "Darken")} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace("{state}", "Lighten")} { ${param}: ${primary_color_lighten_str}; }
      <% html_class = ".primaryColorBg{state}Hover:hover"%>
      ${html_class.replace("{state}", "")} { ${param}: ${primary}; }
      ${html_class.replace("{state}", "Darken")} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace("{state}", "Lighten")} { ${param}: ${primary_color_lighten_str}; }
      <% html_class = ".primaryColorBg{state}Active:active"%>
      ${html_class.replace("{state}", "")} { ${param}: ${primary}; }
      ${html_class.replace("{state}", "Darken")} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace("{state}", "Lighten")} { ${param}: ${primary_color_lighten_str}; }

      <%
        param = "border-color"
        html_class = ".primaryColorBorder{state}"
      %>
      ${html_class.replace("{state}", "")} { ${param}: ${primary_color_str}; }
      ${html_class.replace("{state}", "Darken")} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace("{state}", "Lighten")} { ${param}: ${primary_color_lighten_str}; }
      <% html_class = ".primaryColorBorder{state}Hover:hover" %>
      ${html_class.replace("{state}", "")} { ${param}: ${primary_color_str}; }
      ${html_class.replace("{state}", "Darken")} { ${param}: ${primary_color_darken_str}; }
      ${html_class.replace("{state}", "Lighten")} { ${param}: ${primary_color_lighten_str}; }

      <%
        sidebar = colors["sidebar"]
      %>
      :root {
          --sidebarColor: ${sidebar.web};
          --sidebarColorDarken: ${sidebar.darken.web};
          --sidebarColorLighten: ${sidebar.lighten.web};
      }
    </style>

    <style nonce="${csp_nonce}">
      @font-face {
        font-family: "Quicksand";
        src: url("/assets/font/Quicksand/Quicksand-Regular.ttf");
      }
      @font-face {
        font-family: "Quicksand";
        src: url("/assets/font/Quicksand/Quicksand-Bold.ttf");
        font-weight: bold;
      }

      body {
        font-family: Quicksand;
      }
    </style>

    <script type="text/javascript" nonce="${csp_nonce}">
      GLOBAL_primaryColor = '${primary_color_str}'
      GLOBAL_excludedNotifications = '${excluded_notifications}'.replace(/\s/g, '').split(',')
    </script>
  </head>

  <body>
    <div id="content"></div>
    <!-- NOTE - SG - 2021-03-23 - changing the id of this div must be propagated to the login page component.
         Currently it is Login.jsx.
      -->
    <div id="welcome"><%include file="assets/branding/${website__welcome_page}" /></div>
    <script type="text/javascript" src="/app/tracim_frontend_vendors.js?token=${cache_token}" nonce="${csp_nonce}"></script>
    <script type="text/javascript" src="/app/tracim_frontend_lib.lib.optimized.js?token=${cache_token}" nonce="${csp_nonce}"></script>
    <script type="text/javascript" src="/app/tracim_frontend_lib.style.optimized.js?token=${cache_token}" nonce="${csp_nonce}"></script>

    % for custom_toolbox_file in custom_toolbox_files:
    <script type="text/javascript" src="/custom_toolbox-assets/${custom_toolbox_file.name}?token=${cache_token}" nonce="${csp_nonce}"></script>
    % endfor

    <script type="text/javascript" src="/assets/tracim.vendors~app.optimized.js?token=${cache_token}" nonce="${csp_nonce}"></script>
    <script type="text/javascript" src="/assets/tracim.app.optimized.js?token=${cache_token}" nonce="${csp_nonce}"></script>

    <script type="text/javascript" src="/app/workspace.app.optimized.js?token=${cache_token}" nonce="${csp_nonce}"></script>

    % for app in applications:
    <script type="text/javascript" src="/app/${app.minislug}.app.optimized.js?token=${cache_token}" nonce="${csp_nonce}"></script>
    %endfor
    <script type="text/javascript" src="/app/share_folder.app.optimized.js?token=${cache_token}" nonce="${csp_nonce}"></script>
    <script type="text/javascript" src="/app/admin_workspace_user.app.optimized.js?token=${cache_token}" nonce="${csp_nonce}"></script>
    <script type="text/javascript" src="/app/workspace_advanced.app.optimized.js?token=${cache_token}" nonce="${csp_nonce}"></script>

    <script type="text/javascript" src="/assets/bootstrap/jquery-3.2.1.js?token=${cache_token}" nonce="${csp_nonce}"></script>
    <script type="text/javascript" src="/assets/bootstrap/popper-1.12.3.js?token=${cache_token}" nonce="${csp_nonce}"></script>
    <script type="text/javascript" src="/assets/bootstrap/bootstrap-4.0.0-beta.2.js?token=${cache_token}" nonce="${csp_nonce}"></script>

    <script type="text/javascript" src="/assets/tinymce-4.7.13/js/tinymce/jquery.tinymce.min.js?token=${cache_token}" nonce="${csp_nonce}"></script>
    <script type="text/javascript" src="/assets/tinymce-4.7.13/js/tinymce/tinymce.min.js?token=${cache_token}" nonce="${csp_nonce}"></script>
    <script type="text/javascript" src="/assets/tinymce-4.7.13/js/tinymce/themes/modern/theme.min.js?token=${cache_token}" nonce="${csp_nonce}"></script>

    % for plugin in glob("assets/tinymce-4.7.13/js/tinymce/plugins/*/plugin.min.js"):
    <script type="text/javascript" src="/${plugin}?token=${cache_token}" nonce="${csp_nonce}"></script>
    %endfor

    % for lang in glob("assets/tinymce-4.7.13/js/tinymce/langs/*.js"):
    <script type="text/javascript" src="/${lang}?token=${cache_token}" nonce="${csp_nonce}"></script>
    %endfor

  </body>
</html>
