import i18n from './i18n.js'
import { uniqueId } from 'lodash'
import { htmlCodeToDocumentFragment, tinymceRemove } from 'tracim_frontend_lib'

(function () {
  // NOTE - 2022-01-25 - SG - some tinyMCE languages have both language + variation
  // but Tracim only uses the main language code
  const TINY_MCE_LANGUAGE = {
    fr: 'fr_FR',
    pt: 'pt_PT'
  }

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

  globalThis.wysiwyg = function (
    selector,
    lang,
    handleOnChange,
    handleTinyMceInput,
    handleTinyMceKeyDown,
    handleTinyMceKeyUp,
    handleTinyMceSelectionChange,
    autoFocus = true
  ) {
    // RJ - NOTE - 2021-02-16 - ensure tinyMCE is not currently handling this textarea (or think it is)
    tinymceRemove(selector)

    // HACK: The tiny mce source code modal contain a textarea, but we
    // can't edit it (like it's readonly). The following solution
    // solves the bug: https://stackoverflow.com/questions/36952148/tinymce-code-editor-is-readonly-in-jtable-grid
    $(document).on('focusin', function (e) {
      if ($(e.target).closest('.mce-window').length) {
        e.stopImmediatePropagation()
      }
    })

    const getIframeHeight = function (iframeElement) {
      const currentHeight = iframeElement.frameElement.style.height
      return parseInt(currentHeight.substr(0, currentHeight.length - 2)) // remove the last 'px' to cast to int
    }

    const hiddenTinymceFileInput = document.createElement('input')
    hiddenTinymceFileInput.id = 'hidden_tinymce_fileinput'
    hiddenTinymceFileInput.type = 'file'
    hiddenTinymceFileInput.style.display = 'none'
    hiddenTinymceFileInput.addEventListener('change', () => {
      base64EncodeAndTinyMceInsert(hiddenTinymceFileInput.files)
    })

    document.body.append(hiddenTinymceFileInput)

    const textarea = document.querySelector(selector)
    const content = htmlCodeToDocumentFragment(textarea.value)
    textarea.value = ''

    const language = TINY_MCE_LANGUAGE[lang] || lang

    // NOTE/HACK - 2O22-02-10 - RJ
    // The direction of the interface (RTL or LTR) of TinyMCE is set by the last language being loaded.
    // If you open any langage file, like ar.js, you'll notice that tinymce.addI18n is called. in the
    // object passed to this function, there is a _dir attribute containing "rtl" for RTL languages.
    // This function in turn calls tinymce.util.I18n.add which stores this object and calls setCode.
    // This last method updates the rtl boolean of I18n.
    //
    // As of the time of this note, TinyMCE languages are loaded in a loop by index.mak.
    // Usually, TinyMCE would load them itself but our default CSP policy prevents this.
    // Languages are not necessarily iterated in the same order on different tracim instances
    // so difficult to understand differences in behavior can be observed.
    //
    // For whatever reason, setting language in the tinymce.init is not enough so let's call setCode
    // ourself.
    //
    // WARNING when upgrading TinyMCE, you should check that the direction of TinyMCE's UI is still correct.
    globalThis.tinymce.util.I18n.setCode(language)

    globalThis.tinymce.init({
      selector: selector,
      language,
      menubar: false,
      resize: false,
      relative_urls: false,
      remove_script_host: false,
      plugins: 'advlist anchor autolink charmap code fullscreen help image insertdatetime link lists media paste preview print searchreplace table textcolor visualblocks',
      toolbar: [
        'formatselect | bold italic underline strikethrough | forecolor backcolor | link | customInsertImage | charmap ',
        'alignleft aligncenter alignright alignjustify | numlist bullist outdent indent | table | code | insert | customFullscreen'
      ],
      insertdatetime_element: true,
      content_style: 'div {height: 100%;}',
      paste_data_images: true,
      contextmenu: 'selectall copy paste link customInsertImage table',
      height: '100%',
      width: '100%',
      setup: function ($editor) {
        $editor.ui.registry.addMenuButton('insert', {
          icon: 'plus',
          tooltip: 'Insert',
          fetch: function (f) {
            f('media anchor insertdatetime')
          }
        })

        $editor.on('init', function (e) {
          // NOTE - RJ - 2021-04-28 - appending the content of the textarea
          // after initialization instead of using TinyMCE's own mechanism works
          // around a performance issue in Chrome with big base64 images.
          // See https://github.com/tracim/tracim/issues/4591
          const body = $editor.contentDocument.body
          body.textContent = ''
          body.appendChild(content)

          // INFO - GB - 2020-08-24 - The manipulation below is a hack to add a <p> tag at the end of the text in order to start the text outside the other existing tags
          const id = uniqueId()
          if ($editor.getBody().textContent) {
            $editor.dom.add($editor.getBody(), 'p', { id: id }, '&nbsp;')
            $editor.selection.select($editor.dom.select(`p#${id}`)[0])
          } else {
            $editor.selection.select($editor.getBody(), true)
          }

          if (autoFocus) {
            // INFO - GM - 2020/03/17 - theses 2 lines enable autofocus at the end of the document
            $editor.focus()
            $editor.selection.collapse(false)
          }

          const event = new globalThis.CustomEvent('tinymceLoaded', { detail: {}, editor: this })
          document.dispatchEvent(event)
        })

        const getPosition = (e) => {
          const toolbarPosition = $($editor.getContainer()).find('.tox-toolbar-overlord').first()
          const nodePosition = $editor.selection.getNode().getBoundingClientRect()
          const isFullscreen = $editor.getContainer().className.includes('tox-fullscreen')

          const topPosition = (isFullscreen ? $editor.getContainer().offsetTop : 0) + nodePosition.top + toolbarPosition.height()
          const AUTOCOMPLETE_HEIGHT = 280

          return {
            top: topPosition,
            bottom: (isFullscreen ? $editor.getContainer().offsetTop : 0) + nodePosition.bottom + toolbarPosition.height(),
            isSelectionToTheTop: topPosition < AUTOCOMPLETE_HEIGHT,
            isFullscreen
          }
        }

        if (handleOnChange) {
          $editor.on('change keyup', function (e) {
            handleOnChange({ target: { value: $editor.getContent() } }) // target.value to emulate a js event so the react handler can expect one
          })
        }

        if (handleTinyMceKeyDown) $editor.on('keydown', (e) => { handleTinyMceKeyDown(e, getPosition()) })
        if (handleTinyMceKeyUp) $editor.on('keyup', (e) => { handleTinyMceKeyUp(e, getPosition()) })
        if (handleTinyMceInput) $editor.on('input', (e) => { handleTinyMceInput(e, getPosition()) })

        if (handleTinyMceSelectionChange) {
          $editor.on('selectionchange', function (e) {
            handleTinyMceSelectionChange($editor.selection.getNode().id, getPosition())
          })
        }

        // ////////////////////////////////////////////
        // add custom btn to handle image by selecting them with system explorer
        const customInsertImageButton = {
          icon: 'image',
          tooltip: i18n.t('Image'),
          onAction: function () {
            $editor.focus()
            hiddenTinymceFileInput.value = ''
            hiddenTinymceFileInput.click()
          }
        }

        $editor.ui.registry.addMenuItem('customInsertImage', { ...customInsertImageButton, text: customInsertImageButton.tooltip })
        $editor.ui.registry.addButton('customInsertImage', { ...customInsertImageButton, title: customInsertImageButton.tooltip })

        var customFullscreen = {
          active: false,
          originalHeight: null,
          newHeight: 0
        }

        $editor.ui.registry.addButton('customFullscreen', {
          icon: 'fullscreen',
          title: 'Fullscreen',
          onAction: function () {
            $editor.focus()
            const headerHeight = 60 // 60px is Tracim's header height
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
