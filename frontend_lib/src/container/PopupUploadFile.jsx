import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import CardPopupCreateContent from '../component/CardPopup/CardPopupCreateContent.jsx'
import { TracimComponent } from '../tracimComponent.js'
import FileDropzone from '../component/FileDropzone/FileDropzone.jsx'
import FileUploadList from '../component/FileDropzone/FileUploadList.jsx'
import {
  computeProgressionPercentage,
  setupCommonRequestHeaders,
  FILE_PREVIEW_STATE
} from '../helper.js'
import {
  CUSTOM_EVENT
} from '../customEvent.js'
import PopupProgressUpload from './PopupProgressUpload.jsx'

const MAX_PREVIEW_IMAGE_SIZE = 2000000

class PopupUploadFile extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      fileUploadList: [],
      uploadStarted: false,
      fileUploadPreview: FILE_PREVIEW_STATE.NO_FILE,
      fileUploadProgressPercentage: 0
    }
  }

  handleDropFile = droppedFileList => {
    const { props, state } = this

    if (!droppedFileList || droppedFileList.length === 0) return

    if (!props.multipleFiles && state.fileUploadList.length > 0) {
      this.sendGlobalFlashMessage(props.t('Only one file is allowed'))
      return
    }

    const droppedFileUploadList = droppedFileList.map(f => { return { file: f, progress: 0, errorMessage: this.getFileErrorMessage(f), status: null, json: null } })

    if (droppedFileUploadList.length === 1 && state.fileUploadList.length === 0) {
      this.loadUploadFilePreview(droppedFileUploadList[0].file)
    } else this.setState({ fileUploadPreview: FILE_PREVIEW_STATE.NO_FILE })

    const addedFileUploadList = droppedFileUploadList.filter((fileUpload) => !this.isFileUploadAlreadyInList(fileUpload, state.fileUploadList))
    if (addedFileUploadList.length !== droppedFileUploadList.length) {
      const alreadyPresentFilenameList = droppedFileUploadList
        .filter((fileUpload) => this.isFileUploadAlreadyInList(fileUpload, state.fileUploadList))
        .map(fileUpload => fileUpload.file.name)
      this.sendGlobalFlashMessage(
        <div>
          {props.t('Files already added:')}<br />
          <ul>{alreadyPresentFilenameList.map(filename => <li key={filename}>{filename}</li>)}</ul>
        </div>
      )
    }
    this.setState({ fileUploadList: [...state.fileUploadList, ...addedFileUploadList] })
  }

  isFileUploadAlreadyInList = (fileUpload, fileUploadList) => fileUploadList.some(fu => fu.file.name === fileUpload.file.name)

  isFileUploadInError = (fileUpload) => fileUpload.errorMessage.length > 0

  getFileErrorMessage = (file) => {
    const { props } = this
    if (props.allowedMimeTypes &&
        props.allowedMimeTypes.length > 0 &&
        !props.allowedMimeTypes.includes(file.type)) return props.t('The type of this file is not allowed')
    if (props.maximumFileSize && file.size > props.maximumFileSize) return props.t('The file is too big')
    return ''
  }

  updateFileUploadProgress = (e, fileUpload) => {
    const { state } = this
    if (!e.lengthComputable) return
    fileUpload.percent = computeProgressionPercentage(e.loaded, e.total, state.fileUploadList.length)
    const fileUploadProgressPercentage = Math.round(state.fileUploadList.reduce((accumulator, fu) => accumulator + fu.percent, 0))
    this.setState({ fileUploadProgressPercentage })
  }

  uploadFile = async (fileUpload) => {
    const { props } = this
    // INFO - CH - 2018-08-28 - fetch still doesn't handle event progress. So we need to use old school xhr object
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('files', fileUpload.file)
    for (const entry of Object.entries(props.additionalFormData)) {
      formData.append(entry[0], entry[1])
    }

    xhr.upload.addEventListener('progress', e => this.updateFileUploadProgress(e, fileUpload), false)

    xhr.open(props.httpMethod, props.uploadUrl, true)
    setupCommonRequestHeaders(xhr)
    xhr.withCredentials = true

    const defaultErrorMessage = props.t('Error while uploading file')
    let jsonResponse
    let errorMessage = ''
    try {
      await new Promise((resolve, reject) => {
        xhr.onerror = () => reject(new Error())
        xhr.onload = resolve
        xhr.send(formData)
      })
    } catch {
      errorMessage = defaultErrorMessage
    }

    switch (xhr.status) {
      case 200:
        jsonResponse = JSON.parse(xhr.responseText)
        errorMessage = ''
        break
      case 204:
        errorMessage = ''
        break
      case 400: {
        jsonResponse = JSON.parse(xhr.responseText)
        const errorMessageObject = props.uploadErrorMessageList.find(m => m.status === xhr.status && m.code === jsonResponse.code)
        errorMessage = errorMessageObject ? errorMessageObject.message : defaultErrorMessage
      }
        break
      default:
    }

    return {
      ...fileUpload,
      errorMessage: errorMessage,
      json: jsonResponse,
      status: xhr.status
    }
  }

  handleValidate = async () => {
    const { state, props } = this

    this.setState({ uploadStarted: true })
    const fileUploadDoneList = await Promise.all(state.fileUploadList.map(this.uploadFile))
    const successfulFileUploadList = fileUploadDoneList.filter(fileUpload => !this.isFileUploadInError(fileUpload))
    const failedFileUploadList = fileUploadDoneList.filter(this.isFileUploadInError)

    if (failedFileUploadList.length > 0) {
      this.setState({
        uploadFileList: failedFileUploadList
      })
      this.sendGlobalFlashMessage(props.t('Error while uploading file(s)'))
      props.handleFailure(failedFileUploadList)
    } else props.handleSuccess(successfulFileUploadList)
    this.setState({ uploadStarted: false })
  }

  handleDeleteFileUpload = (fileUpload) => {
    const { state } = this

    const updatedFileUploadList = state.fileUploadList.filter(fu => fu !== fileUpload)
    switch (updatedFileUploadList.length) {
      case 0:
        this.setState({ fileUploadPreview: FILE_PREVIEW_STATE.NO_FILE, fileUploadList: updatedFileUploadList })
        return
      case 1:
        this.loadUploadFilePreview(updatedFileUploadList[0].file)
        break
    }
    this.setState({ fileUploadList: updatedFileUploadList })
  }

  isValidateButtonDisabled = () => {
    const { state } = this
    return state.fileUploadList.length === 0 || state.uploadStarted || state.fileUploadList.some(this.isFileUploadInError)
  }

  loadUploadFilePreview = (file) => {
    if (!file.type.includes('image') || file.size > MAX_PREVIEW_IMAGE_SIZE) return

    const reader = new FileReader()
    reader.onload = e => {
      this.setState({ fileUploadPreview: e.total > 0 ? e.target.result : FILE_PREVIEW_STATE.NO_FILE })
      const img = new Image()
      img.src = e.target.result
      img.onerror = () => this.setState({ fileUploadPreview: FILE_PREVIEW_STATE.NO_FILE })
    }
    reader.readAsDataURL(file)
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  render () {
    const { props, state } = this

    return (
      <CardPopupCreateContent
        onClose={props.handleClose}
        onValidate={this.handleValidate}
        label={props.label}
        customColor={props.color}
        faIcon={props.faIcon}
        contentName={this.isValidateButtonDisabled() ? '' : 'allowValidate'} // hack to update the "disabled" state of the button
        onChangeContentName={() => {}}
        btnValidateLabel={props.t('Validate')}
        customStyle={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <div>
          {state.uploadStarted && (
            <PopupProgressUpload
              color={props.color}
              percent={state.fileUploadProgressPercentage}
            />
          )}
          <FileDropzone
            onClick={() => {}}
            onDrop={this.handleDropFile}
            hexcolor={props.color}
            preview={state.fileUploadPreview}
            multipleFiles={props.multipleFiles}
          />
          {props.children}
          <FileUploadList
            fileUploadList={state.fileUploadList}
            onDeleteFile={this.handleDeleteFileUpload}
            deleteFileDisabled={state.uploadStarted}
          />
        </div>
      </CardPopupCreateContent>
    )
  }
}

PopupUploadFile.propTypes = {
  label: PropTypes.string.isRequired,
  uploadUrl: PropTypes.string.isRequired,
  faIcon: PropTypes.string,
  httpMethod: PropTypes.string,
  color: PropTypes.string.isRequired,
  multipleFiles: PropTypes.bool,
  handleSuccess: PropTypes.func,
  handleFailure: PropTypes.func,
  handleClose: PropTypes.func,
  additionalFormData: PropTypes.object,
  allowedMimeTypes: PropTypes.array,
  maximumFileSize: PropTypes.number,
  uploadErrorMessageList: PropTypes.array
}

PopupUploadFile.defaultProps = {
  additionalFormData: {},
  multipleFiles: false,
  faIcon: 'fa-upload',
  httpMethod: 'POST',
  maximumFileSize: 0,
  handleSuccess: () => {},
  handleFailure: () => {},
  handleClose: () => {},
  uploadErrorMessageList: []
}

export default translate()(TracimComponent(PopupUploadFile))
