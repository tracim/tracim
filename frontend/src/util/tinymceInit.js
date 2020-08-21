import i18n from './i18n.js'

(function () {
  function base64EncodeAndTinyMceInsert (files) {
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 1000000) {
        files[i].allowed = globalThis.confirm(
          i18n.t(
            '{{filename}} is bigger than 1MB, this may take a while to upload, do you want to continue?',
            { filename: files[i].name }
          )
        )
      }
    }

    for (let i = 0; i < files.length; i++) {
      if (files[i].allowed !== false && files[i].type.match('image.*')) {
        const img = document.createElement('img')

        const fr = new globalThis.FileReader()

        fr.readAsDataURL(files[i])

        fr.onloadend = function (e) {
          img.src = e.target.result
          globalThis.tinymce.activeEditor.execCommand('mceInsertContent', false, img.outerHTML)
        }
      }
    }
  }

  globalThis.wysiwyg = function (selector, lang, handleOnChange) {
    // HACK: The tiny mce source code modal contain a textarea, but we
    // can't edit it (like it's readonly). The following solution
    // solve the bug: https://stackoverflow.com/questions/36952148/tinymce-code-editor-is-readonly-in-jtable-grid
    $(document).on('focusin', function (e) {
      if ($(e.target).closest('.mce-window').length) {
        e.stopImmediatePropagation()
      }
    })

    const getIframeHeight = function (iframeElement) {
      const currentHeight = iframeElement.frameElement.style.height
      return parseInt(currentHeight.substr(0, currentHeight.length - 2)) // remove the last 'px' to cast to int
    }

    // TODO - GM - 2020/05/07 - find a better way to handle language support in order to make it more generic
    // see: https://github.com/tracim/tracim/issues/3011
    const getTinyMceLang = (lang) => {
      switch (lang) {
        case 'fr':
          return 'fr_FR'
        case 'pt':
          return 'pt_PT'
        default:
          return lang
      }
    }

    globalThis.tinymce.init({
      selector: selector,
      language: getTinyMceLang(lang),
      menubar: false,
      resize: false,
      skin: 'lightgray',
      relative_urls: false,
      remove_script_host: false,
      plugins: 'advlist autolink lists link image charmap print preview anchor textcolor searchreplace visualblocks code fullscreen insertdatetime media table contextmenu paste code help',
      toolbar: [
        'formatselect | bold italic underline strikethrough | forecolor backcolor | link | customInsertImage | charmap | insert',
        'alignleft aligncenter alignright alignjustify | numlist bullist outdent indent | table | code | customFullscreen'
      ],
      insert_button_items: 'media anchor insertdatetime',
      // toolbar: 'undo redo | bold italic underline strikethrough | link | bullist numlist | outdent indent | table | charmap | styleselect | alignleft aligncenter alignright | fullscreen | customInsertImage | code', // v1
      content_style: 'div {height: 100%;}',
      height: '100%',
      setup: function ($editor) {
        $editor.on('init', function (e) {
          // INFO - GM - 2020/03/17 - theses 3 lines enable autofocus at the end of the document
          $editor.focus()
          $editor.selection.select($editor.getBody(), true)
          $editor.selection.collapse(false)
          const event = new globalThis.CustomEvent('tinymceLoaded', { detail: {}, editor: this })
          document.dispatchEvent(event)
        })

        $editor.on('change keyup', function (e) {
          handleOnChange({ target: { value: $editor.getContent() } }) // target.value to emulate a js event so the react handler can expect one
        })

        // ////////////////////////////////////////////
        // add custom btn to handle image by selecting them with system explorer
        $editor.addButton('customInsertImage', {
          icon: 'mce-ico mce-i-image',
          title: 'Image',
          onclick: function () {
            const hiddenTinymceFileInput = $('#hidden_tinymce_fileinput')
            if (hiddenTinymceFileInput.length > 0) hiddenTinymceFileInput.remove()

            const fileTag = document.createElement('input')
            fileTag.id = 'hidden_tinymce_fileinput'
            fileTag.type = 'file'
            fileTag.style.display = 'none'
            $('body').append(fileTag)

            hiddenTinymceFileInput.on('change', function () {
              base64EncodeAndTinyMceInsert($(this)[0].files)
            })

            hiddenTinymceFileInput.click()
          }
        })

        var customFullscreen = {
          active: false,
          originalHeight: null,
          newHeight: 0
        }

        $editor.addButton('customFullscreen', {
          icon: 'mce-ico mce-i-fullscreen',
          title: 'Fullscreen',
          onclick: function () {
            const headerHeight = 61 // 61px is Tracim's header height
            var iframeElement = $editor.getWin()

            if (customFullscreen.originalHeight === null) customFullscreen.originalHeight = iframeElement.frameElement.style.height

            $editor.execCommand('mceFullScreen')

            var currentHeightInt = getIframeHeight(iframeElement)

            customFullscreen = {
              active: !customFullscreen.active,
              originalHeight: customFullscreen.originalHeight,
              newHeight: customFullscreen.active ? customFullscreen.originalHeight : currentHeightInt - headerHeight
            }

            iframeElement.frameElement.style.height = customFullscreen.newHeight + 'px'

            window.onresize = function () {
              if (customFullscreen.active) {
                var iframeElement = $editor.getWin()
                var currentHeightInt = getIframeHeight(iframeElement)
                customFullscreen.newHeight = currentHeightInt - headerHeight
                iframeElement.frameElement.style.height = customFullscreen.newHeight + 'px'
              }
            }
          }
        })

        // ////////////////////////////////////////////
        // Handle drag & drop image into TinyMce by encoding them in base64 (to avoid uploading them somewhere and keep saving comment in string format)
        $editor
          .on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
            e.preventDefault()
            e.stopPropagation()
          })
          .on('drop', function (e) {
            base64EncodeAndTinyMceInsert(e.dataTransfer.files)
          })
      }
    })
  }
})()
