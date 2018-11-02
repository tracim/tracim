(function () {
  function base64EncodeAndTinyMceInsert (files) { // @todo move this function out of wysiwyg = { ... }
    for (var i = 0; i < files.length; i++) {
      if (files[i].size > 1000000)
        files[i].allowed = confirm(files[i].name + ' is bigger than 1mo, it can takes some time to upload, do you wish to continue?')
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

  wysiwyg = function (selector, lang, handleOnChange) {
    // HACK: The tiny mce source code modal contain a textarea, but we
    // can't edit it (like it's readonly). The following solution
    // solve the bug: https://stackoverflow.com/questions/36952148/tinymce-code-editor-is-readonly-in-jtable-grid
    $(document).on('focusin', function(e) {
      if ($(e.target).closest(".mce-window").length) {
        e.stopImmediatePropagation()
      }
    })

    tinymce.init({
      selector: selector,
      language: lang === 'fr' ? 'fr_FR' : lang,
      menubar: false,
      resize: false,
      skin: 'lightgray',
      plugins:'advlist autolink lists link image charmap print preview anchor textcolor searchreplace visualblocks code fullscreen insertdatetime media table contextmenu paste code help',
      toolbar: [
        'formatselect | bold italic underline strikethrough | forecolor backcolor | link | customInsertImage | charmap | insert',
        'alignleft aligncenter alignright alignjustify | numlist bullist outdent indent | table | code | fullscreen'
      ],
      insert_button_items: 'media anchor insertdatetime',
      // toolbar: 'undo redo | bold italic underline strikethrough | link | bullist numlist | outdent indent | table | charmap | styleselect | alignleft aligncenter alignright | fullscreen | customInsertImage | code', // v1
      content_style: 'div {height: 100%;}',
      setup: function ($editor) {
        $editor.on('change', function (e) {
          handleOnChange({target: {value: $editor.getContent()}}) // target.value to emulate a js event so the react handler can expect one
        })

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
    })
  }
})()
