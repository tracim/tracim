import React, { useRef } from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Editor } from '@tinymce/tinymce-react'

import {
  handleFetchResult
} from '../../helper.js'
import { getSpaceMemberList } from '../../action.async.js'

const defaultMentionList = [
  {
    type: 'cardmenuitem',
    value: '@<span mention-role-level="0"></span>All ',
    label: 'All',
    items: [
      {
        type: 'cardcontainer',
        direction: 'vertical',
        items: [
          {
            type: 'cardtext',
            text: 'All',
            name: 'role_name'
          },
          {
            type: 'cardtext',
            text: 'Role'
          }
        ]
      }
    ]
  },
  {
    type: 'cardmenuitem',
    value: '@<span mention-role-level="1"></span>Reader ',
    label: 'Reader',
    items: [
      {
        type: 'cardcontainer',
        direction: 'vertical',
        items: [
          {
            type: 'cardtext',
            text: 'Reader',
            name: 'role_name'
          },
          {
            type: 'cardtext',
            text: 'Role'
          }
        ]
      }
    ]
  },
  {
    type: 'cardmenuitem',
    value: '@<span mention-role-level="2"></span>Contributor ',
    label: 'Contributor',
    items: [
      {
        type: 'cardcontainer',
        direction: 'vertical',
        items: [
          {
            type: 'cardtext',
            text: 'Contributor',
            name: 'role_name'
          },
          {
            type: 'cardtext',
            text: 'Role'
          }
        ]
      }
    ]
  },
  {
    type: 'cardmenuitem',
    value: '@<span mention-role-level="4"></span>content-manager ',
    label: 'Content manager',
    items: [
      {
        type: 'cardcontainer',
        direction: 'vertical',
        items: [
          {
            type: 'cardtext',
            text: 'Content manager',
            name: 'role_name'
          },
          {
            type: 'cardtext',
            text: 'Role'
          }
        ]
      }
    ]
  },
  {
    type: 'cardmenuitem',
    value: '@<span mention-role-level="8"></span>space-manager ',
    label: 'Space manager',
    items: [
      {
        type: 'cardcontainer',
        direction: 'vertical',
        items: [
          {
            type: 'cardtext',
            text: 'Space manager',
            name: 'role_name'
          },
          {
            type: 'cardtext',
            text: 'Role'
          }
        ]
      }
    ]
  },
]

export const TinyEditor = props => {
  const editorRef = useRef(null)

  const advancedToolBar = 'formatselect alignleft aligncenter alignright alignjustify | ' +
  'bold italic underline strikethrough | forecolor backcolor | link customInsertImage charmap | ' +
  'bullist numlist outdent indent | table | code codesample | insert | removeformat | ' +
  'customFullscreen help'

  const simpleToolBar = 'bold italic underline | bullist numlist'

  const toolbar = props.isAdvancedEdition ? advancedToolBar : simpleToolBar
  const editorKey = props.isAdvancedEdition ? 'advanced_key' : 'simple_key'

  const fetchMemberList = async () => {
    const fetchResult = await handleFetchResult(
      await getSpaceMemberList(props.apiUrl, props.spaceId)
    )

    if (fetchResult.apiResponse.status === 200) {
      return fetchResult.body
    } else {
      return []
    }
  }

  const base64EncodeAndTinyMceInsert = (files) => {
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
          editorRef.current.execCommand('mceInsertContent', false, img.outerHTML)
        }
      }
    }
  }


  return (
    <Editor
      key={editorKey}
      onInit={(evt, editor) => {
        editorRef.current = editor
      }}
      init={{
        min_height: 100,
        height: 100,
        max_height: 300,
        menubar: false,
        statusbar: true,
        toolbar: toolbar,
        plugins: [
          // /////////////////////////////////////////////
          // TinyMCE recommends to use custom plugins in "external plugins" section
          // 'autocompletion',
          // /////////////////////////////////////////////
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code codesample fullscreen',
          'insertdatetime media table paste code help wordcount textcolor'
        ],
        contextmenu: 'selectall copy paste link customInsertImage table',
        codesample_global_prismjs: true,
        codesample_languages: props.codeLanguageList,
        paste_data_images: true,
        relative_urls: false,
        extended_valid_elements: 'span[mention-user-id|mention-role-level]',
        setup: (editor) => {
          editor.ui.registry.addMenuButton('insert', {
            icon: 'plus',
            tooltip: props.t('Insert'),
            fetch: function (f) {
              f('media anchor insertdatetime')
            }
          })
          // /////////////////////////////////////////////
          // add custom btn to handle image by selecting them with system explorer
          const customInsertImageButton = {
            icon: 'image',
            tooltip: props.t('Image'),
            onAction: function () {
              editor.focus()
              hiddenTinymceFileInput.value = ''
              hiddenTinymceFileInput.click()
            }
          }
          editor.ui.registry.addMenuItem('customInsertImage', {
            ...customInsertImageButton,
            text: customInsertImageButton.tooltip
          })
          editor.ui.registry.addButton('customInsertImage', {
            ...customInsertImageButton,
            title: customInsertImageButton.tooltip
          })
          // /////////////////////////////////////////////
          // add custom btn to handle fullscreen
          const customFullscreenButton = {
            icon: 'fullscreen',
            tooltip: props.t('Fullscreen'),
            onAction: function () {
              editor.execCommand('mceFullScreen')

              // customFullscreen = {
              //   active: !customFullscreen.active,
              //   originalHeight: customFullscreen.originalHeight,
              //   newHeight: customFullscreen.active ?
              //     customFullscreen.originalHeight :
              //     currentHeightInt - headerHeight
              // }

              // if (customFullscreen.active) {
              //   GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.HIDE_SIDEBAR, data: { } })
              // }
            }
          }
          editor.ui.registry.addMenuItem('customFullscreen', {
            ...customFullscreenButton,
            text: customFullscreenButton.tooltip
          })
          editor.ui.registry.addButton('customFullscreen', {
            ...customFullscreenButton,
            title: customFullscreenButton.tooltip
          })
          // /////////////////////////////////////////////
          // Prevent default and stop propagation to avoid duplicate
          editor.on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
            e.preventDefault()
            e.stopPropagation()
          })
          // /////////////////////////////////////////////
          // Handle UL and OL in LTR and RTL
          // dir='auto' on the <ul> and <ol> tags to fix rtl display of lists
          // see https://github.com/tracim/tracim/issues/5534
          let isAlreadyTriggered = false
          editor.on('BeforeExecCommand', event => {
            if (
              event.command === 'InsertUnorderedList' ||
              event.command === 'InsertOrderedList'
            ) {
              if (isAlreadyTriggered) {
                isAlreadyTriggered = false
              } else {
                isAlreadyTriggered = true
                event.preventDefault()

                const newListAttributes = event.value
                  ? { ...event.value['list-attributes'], dir: 'auto' }
                  : { dir: 'auto' }
                const newValue = { ...event.value, 'list-attributes': newListAttributes }
                editor.execCommand(event.command, false, newValue)
              }
            }
          })
          // /////////////////////////////////////////////
          // Handle mentions
          editor.ui.registry.addAutocompleter('autocompletion', {
            ch: '@',
            columns: 1,
            minChars: 2,
            maxResults: 10,
            fetch: function (pattern) {
              return new tinymce.util.Promise((resolve) => {
                // NOTE - MP - 2022-11-08 - This load the list of members of the space
                // and is called every time the user types a character after the @
                fetchMemberList().then((memberList) => {
                  const insensitivePattern = pattern.toLowerCase()

                  const matchedMemberList = memberList.filter((member) => {
                    const insensitiveUsername = member.user.username.toLowerCase()
                    return insensitiveUsername.indexOf(insensitivePattern) !== -1
                  })
                  const matchedMentionList = defaultMentionList.filter((mention) => {
                    const insensitiveMentionLabel = mention.label.toLowerCase()
                    return insensitiveMentionLabel.indexOf(insensitivePattern) !== -1
                  })

                  var results = matchedMemberList.map((member) => {
                    const metaData = `mention-user-id="${member.user.user_id}"`
                    return {
                      type: 'cardmenuitem',
                      value: `@<span ${metaData}></span>${member.user.username} `,
                      label: member.user.username,
                      items: [
                        {
                          type: 'cardcontainer',
                          direction: 'vertical',
                          items: [
                            {
                              type: 'cardcontainer',
                              direction: 'horizontal',
                              items: [
                                {
                                  //   type: 'cardimage',
                                  //   src: "api/user/" + member.user.user_id + "/avatar/preview/25x25/avatar",
                                  //   alt: member.user.public_name,
                                  //   name: 'avatar'
                                  // }, {
                                  type: 'cardtext',
                                  text: member.user.username,
                                  name: 'user_name'
                                }
                              ]
                            },
                            {
                              type: 'cardtext',
                              text: 'User'
                            }
                          ]
                        }
                      ]
                    }
                  })
                  resolve(matchedMentionList.concat(results))
                })
              })
            },
            onAction: function (autocompleteApi, rng, value) {
              editor.selection.setRng(rng)
              editor.insertContent(value, { 'raw': true })
              autocompleteApi.hide()
            }
          })
          // /////////////////////////////////////////////
          // Handle shortcuts
          editor.addShortcut('ctrl+enter', '', () => {
            props.handleSend()
          })
        }
      }}
      value={props.content}
      onEditorChange={(newValue, editor) => props.setContent(newValue)}
      onDrop={e => base64EncodeAndTinyMceInsert(e.dataTransfer.files)}
    />
  )
}

export default translate()(TinyEditor)

TinyEditor.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  setContent: PropTypes.func.isRequired,
  spaceId: PropTypes.number.isRequired,
  codeLanguageList: PropTypes.array,
  content: PropTypes.string,
  handleSend: PropTypes.func,
  isAdvancedEdition: PropTypes.bool,
}


TinyEditor.defaultProps = {
  codeLanguageList: [],
  content: '',
  handleSend: () => {},
  isAdvancedEdition: false
}
