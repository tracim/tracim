import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  addAllResourceI18n,
  FileDropzone,
  CUSTOM_EVENT,
  FileUploadList
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
      uploadFiles: [],
      uploadedFiles: [],
      uploadFilePreview: null,
      progressUpload: {
        display: false,
        percent: 0
      },
      uploadStarted: false
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

  componentDidUpdate (prevProps, prevState, snapshot) {
    const { state, props } = this

    if (state.uploadedFiles.length === state.uploadFiles.length && state.uploadStarted) {
      let uploadedFiles = state.uploadedFiles
      this.setState({ uploadStarted: false })

      uploadedFiles = uploadedFiles.filter(f => f.jsonResult.code !== 200)

      GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })

      if (uploadedFiles.length === 0) {
        if (state.uploadFiles.length === 1) {
          GLOBAL_dispatchEvent({
            type: CUSTOM_EVENT.OPEN_CONTENT_URL,
            data: {
              workspaceId: state.uploadedFiles[0].jsonResult.workspace_id,
              contentType: state.appName,
              contentId: state.uploadedFiles[0].jsonResult.content_id
            }
          })
        }
        this.handleClose()
      } else {
        this.sendGlobalFlashMessage(props.t("Some file(s) couldn't be uploaded"))
        this.setState({
          uploadFiles: uploadedFiles,
          uploadedFiles: [],
          uploadStarted: false,
          progressUpload: {
            display: false
          }
        })
      }
    }
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  handleChangeFile = newFileList => {
    const { props, state } = this

    if (!newFileList || !newFileList[0]) return

    const alreadyUploadedList = newFileList.filter(newFile => state.uploadFiles.some(stateFile => stateFile.name === newFile.name))
    if (alreadyUploadedList.length) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: <div>{props.t('Files already uploaded:')}<br /><ul>{alreadyUploadedList.map(file => <li>{file.name}</li>)}</ul></div>,
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    newFileList.forEach(f => { f.percent = 0 })
    const uploadFiles = this.state.uploadFiles
    uploadFiles.push(...newFileList)
    this.setState({ uploadFiles })
  }

  handleClose = () => {
    const { state } = this

    // if (state.progressUpload.display) {
    //   GLOBAL_dispatchEvent({
    //     type: CUSTOM_EVENT.ADD_FLASH_MSG,
    //     data: {
    //       msg: props.t('Please wait until the upload ends'),
    //       type: 'warning',
    //       delay: undefined
    //     }
    //   })
    //   return
    // }

    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT,
      data: {
        name: state.appName
      }
    })
  }

  postFile = async (file) => {
    const { state, props } = this

    const formData = new FormData()
    formData.append('files', file)
    formData.append('parent_id', state.folderId || 0)
    let filePosted = file

    // fetch still doesn't handle event progress. So we need to use old school xhr object
    const xhr = new XMLHttpRequest()

    const uploadInProgress = e => {
      if (e.lengthComputable) {
        const uploadFiles = state.uploadFiles
        uploadFiles[uploadFiles.indexOf(file)].percent = (e.loaded / e.total * 100) / uploadFiles.length

        this.setState({
          progressUpload: {
            display: true
          },
          uploadFiles
        })
      }
    }

    xhr.upload.addEventListener('progress', uploadInProgress, false)

    xhr.open('POST', `${state.config.apiUrl}/workspaces/${state.workspaceId}/files`, true)

    xhr.setRequestHeader('Accept', 'application/json')
    xhr.withCredentials = true

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        const uploadedFiles = state.uploadedFiles
        switch (xhr.status) {
          case 200:
            const jsonResult200 = JSON.parse(xhr.responseText)

            filePosted.jsonResult = { ...jsonResult200, code: 200 }

            uploadedFiles.push(filePosted)
            this.setState({ uploadedFiles })
            break
          case 400:
            const jsonResult400 = JSON.parse(xhr.responseText)

            let hasError = props.t('Error while creating file')
            switch (jsonResult400.code) {
              case 3002: hasError = props.t('A content with the same name already exists'); break
              case 6002: hasError = props.t('The file is larger than the maximum file size allowed'); break
              case 6003: hasError = props.t('Error, the shared space exceed its maximum size'); break
              case 6004: hasError = props.t('You have reach your storage limit, you cannot add new files'); break
            }
            filePosted.jsonResult = jsonResult400
            filePosted.hasError = hasError
            uploadedFiles.push(filePosted)
            this.setState({ uploadedFiles })
            break
          default:
            filePosted.jsonResult = { code: 0 }
            filePosted.hasError = props.t('Error while creating file')
            uploadedFiles.push(filePosted)
            this.setState({ uploadedFiles, progressUpload: { display: false } })
            break
        }
      }
    }

    xhr.send(formData)
  }

  handleValidate = async () => {
    const { state } = this

    this.setState({
      progressUpload: {
        percent: 0
      },
      uploadStarted: true
    })

    state.uploadFiles.forEach((file, index) => this.postFile(file, index))
  }

  handleDeleteFile = (file) => {
    const { state } = this

    const uploadFiles = state.uploadFiles
    uploadFiles.splice(uploadFiles.indexOf(file), 1)

    this.setState({ uploadFiles })
  }

  getPercentUpload () {
    const { state } = this

    return Math.round(state.uploadFiles.reduce((accumulator, currentValue) => accumulator + currentValue.percent, 0))
  }

  idValidateButtonDisabled () {
    const { state } = this

    let disabled = state.uploadFiles.length === 0 || state.uploadStarted
    if (!disabled) state.uploadFiles.forEach(f => { if (f.hasError) disabled = true })

    return disabled
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
        contentName={this.idValidateButtonDisabled() ? '' : 'allowValidate'} // hack to update the "disabled" state of the button
        onChangeContentName={() => {}}
        btnValidateLabel={props.t('Validate and create')}
        customStyle={{ top: 'calc(50% - 177px)' }}
      >
        <div>
          {state.progressUpload.display &&
            <PopupProgressUpload
              color={state.config.hexcolor}
              percent={this.getPercentUpload()}
            />
          }
          <FileDropzone
            onDrop={this.handleChangeFile}
            onClick={this.handleChangeFile}
            hexcolor={state.config.hexcolor}
            multipleFiles
            filesUploaded={state.uploadFiles}
          />

          <FileUploadList
            uploadFilesList={state.uploadFiles}
            onDeleteFile={this.handleDeleteFile}
            deleteFileDisabled={state.uploadStarted}
          />
        </div>
      </CardPopupCreateContent>
    )
  }
}

export default translate()(PopupCreateFile)
