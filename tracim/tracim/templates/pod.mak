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
        function base64EncodeAndTinyMceInsert (files) {
          for (var i = 0; i < files.length; i++) {
            if (files[i].size > 1000000)
              files[i].allowed = confirm(files[i].name + " fait plus de 1mo et peut prendre du temps à insérer, voulez-vous continuer ?")
          }

          for (var i = 0; i < files.length; i++) {
            if (files[i].allowed !== false && files[i].type.match('image.*')) {
              var img = document.createElement('img')

              var fr = new FileReader()

              fr.readAsDataURL(files[i])

              fr.onloadend = function (e) {
                img.src = e.target.result
                tinymce.activeEditor.execCommand('mceInsertContent', false, img.outerHTML)
              }
            }
          }
        }

        // HACK: The tiny mce source code modal contain a textarea, but we
        // can't edit it (like it's readonly). The following solution
        // solve the bug: https://stackoverflow.com/questions/36952148/tinymce-code-editor-is-readonly-in-jtable-grid
        // $(document).on('focusin', function(e) {
        // if ($(e.target).closest(".mce-window").length) {
        //     e.stopImmediatePropagation();
        // }});

        tinymce.init({
            menubar:false,
            statusbar:true,
            branding: false,
            plugins: [ "table", "image", "charmap", "fullscreen", "autolink", "colorpicker", "link", "code", "contextmenu", "lists"],
            language: globalTracimLang === 'fr' ? 'fr_FR' : globalTracimLang, // tinymce does't accept en_US as language, it is its default value named 'en'
            selector:'${selector}',
            toolbar: [
              "undo redo | bold italic underline strikethrough | link | bullist numlist | outdent indent | table | charmap | styleselect | alignleft aligncenter alignright | fullscreen | customInsertImage | code",
            ],
            contextmenu: "link",
            link_context_toolbar: true,
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
            ],
            setup: function ($editor) {
              //////////////////////////////////////////////
              // add custom btn to handle image by selecting them with system explorer
              $editor.addButton('customInsertImage', {
                icon: 'mce-ico mce-i-image',
                title: 'Image',
                onclick: function () {
                  if ($('#hidden_tinymce_fileinput').length > 0) $('#hidden_tinymce_fileinput').remove()

                  fileTag = document.createElement('input')
                  fileTag.id = 'hidden_tinymce_fileinput'
                  fileTag.type = 'file'
                  $('body').append(fileTag)

                  $('#hidden_tinymce_fileinput').on('change', function () {
                    base64EncodeAndTinyMceInsert($(this)[0].files)
                  })

                  $('#hidden_tinymce_fileinput').click()
                }
              })

              //////////////////////////////////////////////
              // Handle drag & drop image into TinyMce by encoding them in base64 (to avoid uploading them somewhere and keep saving comment in string format)
              $editor
              .on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
                e.preventDefault()
                e.stopPropagation()
              })
              .on('drop', function(e) {
                base64EncodeAndTinyMceInsert(e.dataTransfer.files)
              })
            }
        });
    </script>
</%def>

<%def name="FLASH_MSG(css_class='')">
    <% flash=tg.flash_obj.render('flash', use_js=False) %>
    % if flash:
        <div class="" id="flash-message-to-fade-out">
            <div id="t-full-app-alert-message-id" class="flashmsg__data ${css_class}">
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
                    $("#flash-message-to-fade-out").fadeTo(8000, 0, 'linear', function () {
                        $(this).hide()
                    });
                }, 2000);
            });
        </script>

    % endif
</%def>
