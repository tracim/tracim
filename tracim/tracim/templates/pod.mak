<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="ICO_URL(icon_size, icon_path)">${h.IconPath(icon_size, icon_path)|n}</%def>
<%def name="ICO(icon_size, icon_path, title='')"><img src="${h.IconPath(icon_size, icon_path)|n}" alt="" title="${title}"/></%def>
<%def name="ICO_TOOLTIP(icon_size, icon_path, title='')"><span rel="tooltip" data-toggle="tooltip" data-placement="bottom" title="${title}">${ICO(icon_size, icon_path, title)}</span></%def>
<%def name="ICO_BADGED(icon_size, icon_path, title='', css_class='badge')"><span class="${css_class}" rel="tooltip" data-toggle="tooltip" data-placement="bottom" title="${title}">${ICO(icon_size, icon_path, title)}</span></%def>
<%def name="ICO_FA_BADGED(fa_class='fa fa-flag', title='', css_style='')"><i style="${css_style}" class="${fa_class}" rel="tooltip" data-toggle="tooltip" data-placement="bottom" title="${title}"></i></%def>
<%def name="FA(fa_class='fa-flag', title='', css_style='', color='auto')"><i style="color: ${color}; ${css_style}" class="fa ${fa_class}" title="${title}"></i></%def>

<%def name="HELP_MODAL_DIALOG(help_page)"><div id="help-modal-dialog-${help_page}" class="modal" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"></div></div></div></%def>

<%def name="NO_CONTENT_INFO(message)"><div class="alert alert-warning" role="alert">${ICO(32, 'status/dialog-information')} ${message|n}</div></%def>
                
<%def name="ICO_ACTION(icon_size, icon_path, title, link_url, current_user, required_profile_id)">
    % if current_user.profile.id>=required_profile_id:
        <a href="${link_url}">${ICO_TOOLTIP(icon_size, icon_path, title)}</a>
    % else:
        <span class="tracim-less-visible">${ICO(icon_size, icon_path)}</span>
    % endif
</%def>

<%def name="MODAL_DIALOG(css_id, modal_size='')">
    <div id="${css_id}" class="modal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog ${modal_size}">
            <div class="modal-content">
            </div>
        </div>
    </div>
</%def>

<%def name="TINYMCE_INIT_SCRIPT(selector)">
    <script>
        tinymce.init({
            menubar:false,
            statusbar:true,
            plugins: [ "table", "image", "charmap", "fullscreen", "autolink", "colorpicker" ],

            skin : 'tracim',
            selector:'${selector}',
            toolbar: [
              "undo redo | bold italic underline strikethrough | bullist numlist outdent indent | table | charmap | styleselect | alignleft aligncenter alignright | fullscreen",
            ],
            paste_data_images: true,
            table_default_attributes: {
                'class': 'user_content'
            },
            content_css: '/assets/css/rich-text-area.css',
            table_default_styles: {
                border: '1px solid #CCC',
                borderCollapse: 'collapse',
                padding: '20px'
            },
            table_class_list: [
                {title: 'Normal', value: 'user_content'},
                {title: 'First row is header', value: 'user_content first_row_headers'},
                {title: 'First column is header', value: 'user_content first_column_headers'}
            ]

        });
    </script>
</%def>

<%def name="FLASH_MSG(css_class='')">
    <% flash=tg.flash_obj.render('flash', use_js=False) %>
    % if flash:
        <div class="row" id="flash-message-to-fade-out">
            <div id="t-full-app-alert-message-id" class="${css_class}">
                ${flash|n}
            </div>
        </div>
        ## HACK - D.A. - 2014-10-21
        ##
        ## The following JS "hack" is intended to make TG2 flash messages compatible with bootstrap alert classes
        ## This should disappear as soon as LESS is implemented in the application
        ## meaning we'll define a alert-ok style inheriting from alert-info, etc
        <script>
            $( document ).ready(function() {
                $('.alert-ok').removeClass('alert-ok').addClass('alert-info');
                $('.alert-error').removeClass('alert-error').addClass('alert-danger');

                window.setTimeout(function() {
                    $("#flash-message-to-fade-out").fadeTo(2000, 0.75).fadeTo(2000, 0.5).fadeTo(8000, 0);
                }, 2000);
            });
        </script>

    % endif
</%def>
