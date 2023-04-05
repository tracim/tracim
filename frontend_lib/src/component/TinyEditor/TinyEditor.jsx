import React, { useEffect, useRef } from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import i18n from '../../i18n.js'
import { Editor } from '@tinymce/tinymce-react'

import {
  getAvatarBaseUrl,
  handleFetchResult
} from '../../helper.js'
import {
  getMyselfKnownContents
} from '../../action.async.js'
import {
  CUSTOM_EVENT
} from '../../customEvent.js'

// require('./TinyEditor.styl') // see https://github.com/tracim/tracim/issues/1156

const advancedToolBar = [
  'formatselect alignleft aligncenter alignright alignjustify | ',
  'bold italic underline strikethrough | forecolor backcolor | ',
  'link customInsertImage emoticons charmap | bullist numlist outdent indent | table | ',
  'code codesample | insert | removeformat | customFullscreen help'
].join('')

const simpleToolBar = 'bold italic underline | bullist numlist | customFullscreen help'

const handleFileSelected = (e, editorRef) => {
  const files = Array.from(e.target.files)
  base64EncodeAndTinyMceInsert(editorRef, files)
}

const base64EncodeAndTinyMceInsert = (editorRef, files) => {
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

/**
 * Translate Tracim language code to TinyMCE language code
 * In some cases, Tracim and TinyMCE use different language codes
 * In these cases, we need to translate the language code
 * @param {String} lang
 * @returns {String} TinyMCE language code
 */
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

export const TinyEditor = props => {
  const editorRef = useRef(null)
  const inputRef = useRef(null)

  let defaultRoleList = []

  const toolbar = props.isAdvancedEdition ? advancedToolBar : simpleToolBar
  // NOTE - MP - 2023-01-10 - Changing the key allow reloading the Editor component this allows us
  // to change the toolbar
  const editorKey = props.isAdvancedEdition ? 'advanced_key' : 'simple_key'

  useEffect(() => {
    defaultRoleList = props.roleList.map(role => ({
      type: 'cardmenuitem',
      direction: 'horizontal',
      value: `@${props.t(role.slug)} `,
      label: `@${props.t(role.slug)}`,
      items: [
        {
          type: 'cardtext',
          text: props.t(role.description),
          name: 'roleDescription',
          classes: ['tinymce-role-description']
        },
        {
          type: 'cardtext',
          text: `@${props.t(role.slug)}`,
          name: 'roleName',
          classes: ['tinymce-role-name']
        }
      ]
    }))
  }, [props.isAdvancedEdition, props.roleList])

  return (
    <>
      <input
        id='hidden_tinymce_fileinput'
        onChange={(e) => handleFileSelected(e, editorRef)}
        ref={inputRef}
        style={{ display: 'none' }}
        type='file'
      />
      <Editor
        key={editorKey}
        tinymceScriptSrc='/assets/tinymce-5.10.3/js/tinymce/tinymce.min.js'
        disabled={props.isDisabled}
        onInit={(evt, editor) => {
          editorRef.current = editor
        }}
        init={{
          selector: 'textarea',
          language: getTinyMceLang(props.language),
          height: props.height,
          max_height: props.maxHeight,
          min_height: props.minHeight,
          width: '100%',
          placeholder: props.placeholder,
          menubar: false,
          resize: false,
          statusbar: props.isStatusBarEnabled,
          toolbar: toolbar,
          default_link_target: '_blank',
          plugins: [
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code codesample fullscreen emoticons',
            'insertdatetime media table paste code help wordcount',
            props.isAutoResizeEnabled ? 'autoresize' : ''
          ],
          contextmenu: 'selectall copy paste link customInsertImage table',
          codesample_global_prismjs: true,
          codesample_languages: props.codeLanguageList,
          paste_data_images: true,
          relative_urls: false,
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
                inputRef.current.value = ''
                inputRef.current.click()
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
            // add custom button to handle fullscreen
            let isFullScreen = false
            const customFullscreenButton = {
              icon: 'fullscreen',
              tooltip: props.t('Fullscreen'),
              onAction: function () {
                editor.execCommand('mceFullScreen')

                isFullScreen = !isFullScreen

                if (isFullScreen) {
                  GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.HIDE_SIDEBAR, data: {} })
                }
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
            // Autocompleter functions
            const onAction = function (autocompleteApi, rng, value) {
              editor.selection.setRng(rng)
              editor.insertContent(value)
              autocompleteApi.hide()
            }
            // /////////////////////////////////////////////
            // Handle mentions
            const maxFetchResults = 15
            if (props.isMentionEnabled) {
              editor.ui.registry.addAutocompleter('mentions', {
                ch: '@',
                columns: 1,
                highlightOn: ['roleName', 'publicName', 'username'],
                minChars: 0,
                maxResults: maxFetchResults,
                fetch: async function (pattern) {
                  const insensitivePattern = pattern.toLowerCase()
                  const matchedMemberList = props.userList.filter((user) => {
                    if (!user.username) {
                      return false
                    }
                    const insensitiveUsername = user.username.toLowerCase()
                    const insensitivePublicName = user.publicName.toLowerCase()
                    const isUsername = insensitiveUsername.indexOf(insensitivePattern) !== -1
                    const isPublicName = insensitivePublicName.indexOf(insensitivePattern) !== -1
                    return isUsername || isPublicName
                  })
                  const matchedRoleList = defaultRoleList.filter((role) => {
                    const insensitiveRoleLabel = role.label.toLowerCase()
                    const isRole = insensitiveRoleLabel.indexOf(insensitivePattern) !== -1
                    return isRole
                  })
                  const userResultList = matchedMemberList.map((user) => ({
                    type: 'cardmenuitem',
                    value: `@${user.username} `,
                    label: `@${user.username}`,
                    items: [
                      {
                        type: 'cardcontainer',
                        align: 'left',
                        direction: 'horizontal',
                        valign: 'middle',
                        items: [
                          {
                            type: 'cardimage',
                            src: `${getAvatarBaseUrl(props.apiUrl, user.id)}/raw/avatar`,
                            alt: user.publicName,
                            name: 'avatar',
                            classes: ['tinymce-avatar']
                          },
                          {
                            type: 'cardtext',
                            text: user.publicName,
                            name: 'publicName',
                            classes: ['tinymce-public-name']
                          },
                          {
                            type: 'cardtext',
                            text: `@${user.username}`,
                            name: 'username',
                            classes: ['tinymce-username']
                          }
                        ]
                      }
                    ]
                  }))

                  return matchedRoleList.concat(userResultList)
                },
                onAction: onAction
              })
            }
            // /////////////////////////////////////////////
            // Handle content link
            if (props.isContentLinkEnabled) {
              editor.ui.registry.addAutocompleter('content', {
                ch: '#',
                columns: 1,
                highlightOn: ['content_label', 'content_id'],
                minChars: 0,
                maxResults: maxFetchResults,
                fetch: async function (pattern) {
                  try {
                    const contentList = await handleFetchResult(
                      await getMyselfKnownContents(props.apiUrl, pattern, maxFetchResults)
                    )
                    const insensitivePattern = pattern.toLowerCase()
                    const matchedContentList = contentList.body.filter((content) => {
                      const insensitiveContentLabel = content.label.toLowerCase()
                      const contentId = content.content_id
                      const isLabel = insensitiveContentLabel.indexOf(insensitivePattern) !== -1
                      const isId = contentId.toString().indexOf(insensitivePattern) !== -1
                      return isLabel || isId
                    })

                    const resultList = matchedContentList.map((content) => {
                      return {
                        type: 'cardmenuitem',
                        value: `#${content.content_id} `,
                        label: content.label,
                        items: [
                          {
                            type: 'cardcontainer',
                            align: 'left',
                            direction: 'vertical',
                            valign: 'middle',
                            items: [
                              {
                                type: 'cardtext',
                                text: content.label,
                                name: 'content_label',
                                classes: ['tinymce-content-label']
                              },
                              {
                                type: 'cardtext',
                                text: `#${content.content_id.toString()}`,
                                name: 'content_id',
                                classes: ['tinymce-content-id']
                              }
                            ]
                          }
                        ]
                      }
                    })

                    return resultList
                  } catch (e) {
                    console.error(
                      'Error in TinyEditor.jsx, couldn\'t fetch content list properly:\n', e
                    )
                    return []
                  }
                },
                onAction: onAction
              })
            }
            // /////////////////////////////////////////////
            // Handle tab to select autocomplete
            editor.on('keydown', function (e) {
              if (e.key === 'Tab') {
                const autoCompleteElement = document.querySelector('.tox-collection__item--active')
                if (autoCompleteElement) {
                  e.preventDefault()
                  autoCompleteElement.click()
                }
              }
            })
            // /////////////////////////////////////////////
            // Handle shortcuts
            editor.addShortcut('ctrl+13', 'Send comment', () => {
              props.onCtrlEnterEvent(editor.getContent(), false)
              document.activeElement.blur()
            })
          }
        }}
        value={props.content}
        onEditorChange={(newValue, editor) => props.setContent(newValue)}
        onDrop={e => base64EncodeAndTinyMceInsert(editorRef, e.dataTransfer.files)}
      />
    </>
  )
}

export default translate()(TinyEditor)

TinyEditor.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  setContent: PropTypes.func.isRequired,
  // End of required props /////////////////////////////////////////////////////
  codeLanguageList: PropTypes.array,
  content: PropTypes.string,
  onCtrlEnterEvent: PropTypes.func,
  height: PropTypes.any,
  isAdvancedEdition: PropTypes.bool,
  isAutoResizeEnabled: PropTypes.bool,
  isContentLinkEnabled: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isMentionEnabled: PropTypes.bool,
  isStatusBarEnabled: PropTypes.bool,
  language: PropTypes.string,
  maxHeight: PropTypes.number,
  minHeight: PropTypes.number,
  placeholder: PropTypes.string,
  roleList: PropTypes.array,
  userList: PropTypes.array
}

TinyEditor.defaultProps = {
  codeLanguageList: [],
  content: '',
  onCtrlEnterEvent: () => { },
  height: undefined,
  isAdvancedEdition: false,
  isAutoResizeEnabled: true,
  isContentLinkEnabled: true,
  isDisabled: false,
  isMentionEnabled: true,
  isStatusBarEnabled: false,
  language: 'en',
  maxHeight: undefined,
  minHeight: 100,
  placeholder: '',
  roleList: [],
  userList: []
}
