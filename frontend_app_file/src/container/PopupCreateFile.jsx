import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  addAllResourceI18n,
  FileDropzone,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import PopupProgressUpload from '../component/PopupProgressUpload.jsx'
// FIXME - GB - 2019-07-04 - The debug process for creation popups are outdated
// https://github.com/tracim/tracim/issues/2066
import { debug } from '../debug.js'

class PopupCreateFile extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'file', // must remain 'file' because it is the name of the react built app (which contains File and PopupCreateFile)
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      workspaceId: props.data ? props.data.workspaceId : debug.workspaceId,
      folderId: props.data ? props.data.folderId : debug.folderId,
      uploadFile: null,
      uploadFilePreview: null,
      progressUpload: {
        display: false,
        percent: 0
      }
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<PopupCreateFile> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        break
    }
  }

  componentWillUnmount () {
    // console.log('%c<File> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  handleChangeFile = newFile => {
    if (!newFile || !newFile[0]) return

    const fileToSave = newFile[0]

    if (
      !fileToSave.type.includes('image') ||
      fileToSave.size > 2000000
    ) {
      this.setState({
        uploadFile: fileToSave,
        uploadFilePreview: false
      })
      return
    }

    this.setState({ uploadFile: fileToSave })

    var reader = new FileReader()
    reader.onload = e => {
      this.setState({ uploadFilePreview: e.total > 0 ? e.target.result : false })
      const img = new Image()
      img.src = e.target.result
      img.onerror = () => this.setState({ uploadFilePreview: false })
    }
    reader.readAsDataURL(fileToSave)
  }

  handleClose = () => {
    const { state, props } = this

    if (state.progressUpload.display) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: props.t('Please wait until the upload ends'),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT,
      data: {
        name: state.appName
      }
    })
  }

  handleValidate = async () => {
    const { state } = this

    const formData = new FormData()
    formData.append('files', state.uploadFile)
    formData.append('parent_id', state.folderId || 0)

    // fetch still doesn't handle event progress. So we need to use old school xhr object
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('loadstart', () => this.setState({ progressUpload: { display: false, percent: 0 } }), false)
    const uploadInProgress = e => e.lengthComputable && this.setState({ progressUpload: { display: true, percent: Math.round(e.loaded / e.total * 100) } })
    xhr.upload.addEventListener('progress', uploadInProgress, false)
    xhr.upload.addEventListener('load', () => this.setState({ progressUpload: { display: false, percent: 0 } }), false)

    xhr.open('POST', `${state.config.apiUrl}/workspaces/${state.workspaceId}/files`, true)

    xhr.setRequestHeader('Accept', 'application/json')
    xhr.withCredentials = true

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        switch (xhr.status) {
          case 200:
            const jsonResult200 = JSON.parse(xhr.responseText)
            this.handleClose()

            GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })

            GLOBAL_dispatchEvent({
              type: CUSTOM_EVENT.OPEN_CONTENT_URL,
              data: {
                workspaceId: jsonResult200.workspace_id,
                contentType: state.appName,
                contentId: jsonResult200.content_id
              }
            })
            break
          case 400:
            const jsonResult400 = JSON.parse(xhr.responseText)
            switch (jsonResult400.code) {
              case 3002:
                GLOBAL_dispatchEvent({
                  type: CUSTOM_EVENT.ADD_FLASH_MSG,
                  data: {
                    msg: this.props.t('A content with the same name already exists'),
                    type: 'warning',
                    delay: undefined
                  }
                })
                break
            }
            break
          default: GLOBAL_dispatchEvent({
            type: CUSTOM_EVENT.ADD_FLASH_MSG,
            data: {
              msg: this.props.t('Error while creating file'),
              type: 'warning',
              delay: undefined
            }
          })
        }
      }
    }

    xhr.send(formData)
  }

  render () {
    const { props, state } = this

    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={props.t(state.config.creationLabel)}
        customColor={state.config.hexcolor}
        faIcon={state.config.faIcon}
        contentName={state.uploadFile ? 'allowValidate' : ''} // hack to update the "disabled" state of the button
        onChangeContentName={() => {}}
        btnValidateLabel={props.t('Validate and create')}
        customStyle={{ top: 'calc(50% - 177px)' }}
      >
        <div>
          {state.progressUpload.display &&
            <PopupProgressUpload
              color={state.config.hexcolor}
              percent={state.progressUpload.percent}
              filename={state.uploadFile ? state.uploadFile.name : ''}
            />
          }
          <FileDropzone
            onDrop={this.handleChangeFile}
            onClick={this.handleChangeFile}
            hexcolor={state.config.hexcolor}
            preview={state.uploadFilePreview}
            filename={state.uploadFile ? state.uploadFile.name : ''}
          />
        </div>
      </CardPopupCreateContent>
    )
  }
}

export default translate()(PopupCreateFile)
