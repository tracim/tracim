import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  addAllResourceI18n,
  computeProgressionPercentage,
  FileDropzone,
  CUSTOM_EVENT,
  FileUploadList,
  FILE_PREVIEW_STATE
} from 'tracim_frontend_lib'
import PopupProgressUpload from '../component/PopupProgressUpload.jsx'
// FIXME - GB - 2019-07-04 - The debug process for creation popups are outdated
// https://github.com/tracim/tracim/issues/2066
import { debug } from '../debug.js'

class PopupCreateFile extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'file', // INFO - CH - 2018-08-28 - must remain 'file' because it is the name of the react built app (which contains File and PopupCreateFile)
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      workspaceId: props.data ? props.data.workspaceId : debug.workspaceId,
      folderId: props.data ? props.data.folderId : debug.folderId,
      fileToUploadList: [],
      uploadFilePreview: FILE_PREVIEW_STATE.NO_FILE,
      uploadStarted: false
    }

    // INFO - CH - 2018-08-28 - i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
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
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  handleAllFileUploadEnd = (uploadedFileList) => {
    const { state, props } = this

    const uploadedFileFailedList = uploadedFileList.filter(f => f.jsonResult.code !== 200)

    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })

    if (uploadedFileFailedList.length === 0) {
      if (state.fileToUploadList.length === 1) {
        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.OPEN_CONTENT_URL,
          data: {
            workspaceId: uploadedFileList[0].jsonResult.workspace_id,
            contentType: state.appName,
            contentId: uploadedFileList[0].jsonResult.content_id
          }
        })
      }
      this.handleClose(false)
      return
    }

    this.sendGlobalFlashMessage(props.t("Some file(s) couldn't be uploaded"))
    this.setState({
      fileToUploadList: uploadedFileFailedList,
      uploadStarted: false
    })
  }

  handleChangeFile = newFileList => {
    const { props, state } = this

    if (!newFileList || newFileList.length === 0) return

    // INFO - GM - 2020-01-03 - newFileList is an array of File and we can't use spread operator on it in order to add a new attribute
    // See https://developer.mozilla.org/fr/docs/Web/API/File
    let newFileListResult = newFileList.map(f => { f.percent = 0; return f })

    if (newFileList.length === 1 && state.fileToUploadList.length === 0) {
      this.loadUploadFilePreview(newFileList[0])
    } else if (state.uploadFilePreview) this.setState({ uploadFilePreview: FILE_PREVIEW_STATE.NO_FILE })

    const alreadyUploadedList = newFileList.filter((newFile) => this.isFileAlreadyInList(newFile, state.fileToUploadList))
    if (alreadyUploadedList.length > 0) {
      this.sendGlobalFlashMessage(<div>{props.t('Files already uploaded:')}<br /><ul>{alreadyUploadedList.map(file => <li>{file.name}</li>)}</ul></div>)
      newFileListResult = newFileList.filter((newFile) => !this.isFileAlreadyInList(newFile, state.fileToUploadList))
    }
    newFileListResult = newFileListResult.concat(state.fileToUploadList)
    this.setState({ fileToUploadList: newFileListResult })
  }

  handleClose = (isFromUserAction) => {
    const { state, props } = this

    if (isFromUserAction && state.uploadStarted) {
      this.sendGlobalFlashMessage(props.t('Please wait until the upload ends'))
      return
    }

    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT,
      data: {
        name: state.appName
      }
    })
  }

  isFileAlreadyInList = (fileToFind, list) => list.some(file => file.name === fileToFind.name)

  uploadInProgress = (e, file) => {
    if (e.lengthComputable) {
      const uploadFileInProgressList = this.state.fileToUploadList
      uploadFileInProgressList[uploadFileInProgressList.indexOf(file)].percent = computeProgressionPercentage(e.loaded, e.total, uploadFileInProgressList.length)

      this.setState({
        fileToUploadList: uploadFileInProgressList
      })
    }
  }

  postFile = async (file) => {
    return new Promise((resolve, reject) => {
      const { state } = this

      const formData = new FormData()
      formData.append('files', file)
      formData.append('parent_id', state.folderId || 0)

      // INFO - CH - 2018-08-28 - fetch still doesn't handle event progress. So we need to use old school xhr object
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', e => this.uploadInProgress(e, file), false)

      xhr.open('POST', `${state.config.apiUrl}/workspaces/${state.workspaceId}/files`, true)

      xhr.setRequestHeader('Accept', 'application/json')
      xhr.withCredentials = true

      xhr.onerror = () => reject(new Error())

      xhr.onload = () => resolve(xhr)

      xhr.send(formData)
    })
  }

  buildUploadedFileResponse = async (file) => ({
    xhr: await this.postFile(file),
    file: file
  })

  handleValidate = async () => {
    const { state, props } = this

    this.setState({ uploadStarted: true })

    Promise.all(state.fileToUploadList.map(async (file) =>
      this.buildUploadedFileResponse(file)
    )).then(uploadedFileResponseList => {
      this.handleAllFileUploadEnd(uploadedFileResponseList.map((uploadedFileResponse) => this.handleFileUploadEnd(uploadedFileResponse.xhr, uploadedFileResponse.file)))
    }).catch(() => {
      this.sendGlobalFlashMessage(props.t('Error while creating file'))
      this.handleClose(false)
    })
  }

  handleFileUploadEnd = (xhr, file) => {
    const { props } = this

    const filePosted = new File([file], file.name)
    switch (xhr.status) {
      case 200:
        const jsonResult200 = JSON.parse(xhr.responseText)

        filePosted.jsonResult = { ...jsonResult200, code: 200 }
        break
      case 400:
        const jsonResult400 = JSON.parse(xhr.responseText)

        let errorMessage = props.t('Error while creating file')
        switch (jsonResult400.code) {
          case 3002:
            errorMessage = props.t('A content with the same name already exists')
            break
          case 6002:
            errorMessage = props.t('The file is larger than the maximum file size allowed')
            break
          case 6003:
            errorMessage = props.t('Error, the shared space exceed its maximum size')
            break
          case 6004:
            errorMessage = props.t('You have reach your storage limit, you cannot add new files')
            break
        }
        filePosted.jsonResult = jsonResult400
        filePosted.errorMessage = errorMessage
        break
      default:
        filePosted.jsonResult = { code: 0 }
        filePosted.errorMessage = props.t('Error while creating file')
        break
    }
    return filePosted
  }

  handleDeleteFile = (file) => {
    const { state } = this

    const uploadFileWithoutDeletedFileList = state.fileToUploadList.filter(f => f.name !== file.name)
    switch (uploadFileWithoutDeletedFileList.length) {
      case 0:
        this.setState({ uploadFilePreview: FILE_PREVIEW_STATE.NO_FILE, fileToUploadList: uploadFileWithoutDeletedFileList })
        return
      case 1:
        this.loadUploadFilePreview(uploadFileWithoutDeletedFileList[0])
        break
    }
    this.setState({ fileToUploadList: uploadFileWithoutDeletedFileList })
  }

  getPercentUpload () {
    const { state } = this

    return Math.round(state.fileToUploadList.reduce((accumulator, currentValue) => accumulator + currentValue.percent, 0))
  }

  isValidateButtonDisabled () {
    const { state } = this

    if (state.fileToUploadList.length === 0 || state.uploadStarted) return true
    return state.fileToUploadList.some(f => f.errorMessage)
  }

  loadUploadFilePreview = (file) => {
    if (file.type.includes('image') && file.size <= 2000000) {
      let reader = new FileReader()
      reader.onload = e => {
        this.setState({ uploadFilePreview: e.total > 0 ? e.target.result : FILE_PREVIEW_STATE.NO_FILE })
        const img = new Image()
        img.src = e.target.result
        img.onerror = () => this.setState({ uploadFilePreview: FILE_PREVIEW_STATE.NO_FILE })
      }
      reader.readAsDataURL(file)
    }
  }

  render () {
    const { props, state } = this

    return (
      <CardPopupCreateContent
        onClose={() => this.handleClose(true)}
        onValidate={this.handleValidate}
        label={props.t(state.config.creationLabel)}
        customColor={state.config.hexcolor}
        faIcon={state.config.faIcon}
        contentName={this.isValidateButtonDisabled() ? '' : 'allowValidate'} // hack to update the "disabled" state of the button
        onChangeContentName={() => {}}
        btnValidateLabel={props.t('Validate and create')}
        customStyle={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <div>
          {state.uploadStarted &&
            <PopupProgressUpload
              color={state.config.hexcolor}
              percent={this.getPercentUpload()}
            />
          }
          <FileDropzone
            onDrop={this.handleChangeFile}
            hexcolor={state.config.hexcolor}
            preview={state.uploadFilePreview}
            multipleFiles
          />

          <FileUploadList
            fileToUploadList={state.fileToUploadList}
            onDeleteFile={this.handleDeleteFile}
            deleteFileDisabled={state.uploadStarted}
          />
        </div>
      </CardPopupCreateContent>
    )
  }
}

export default translate()(PopupCreateFile)
