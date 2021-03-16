import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import CardPopupCreateContent from '../component/CardPopup/CardPopupCreateContent.jsx'
import { TracimComponent } from '../tracimComponent.js'
import FileDropzone from '../component/FileDropzone/FileDropzone.jsx'
import FileUploadList from '../component/FileDropzone/FileUploadList.jsx'
import {
  computeProgressionPercentage,
  sendGlobalFlashMessage,
  FILE_PREVIEW_STATE
} from '../helper.js'
import {
  createFileUpload,
  uploadFile,
  isFileUploadInList,
  isFileUploadInErrorState
} from '../fileUpload.js'
import PopupProgressUpload from './PopupProgressUpload.jsx'

const MAX_PREVIEW_IMAGE_SIZE = 20 * 1024 * 1024 // 20 MBytes

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

  handleDropFile = async droppedFileList => {
    const { props, state } = this

    if (!droppedFileList || droppedFileList.length === 0) return

    if (!props.multipleFiles && state.fileUploadList.length > 0) {
      sendGlobalFlashMessage(props.t('Only one file is allowed'))
      return
    }

    const droppedFileUploadList = droppedFileList.map(file => createFileUpload(file, this.getFileErrorMessage(file)))

    const addedFileUploadList = droppedFileUploadList.filter((fileUpload) => !isFileUploadInList(fileUpload, state.fileUploadList))
    if (addedFileUploadList.length !== droppedFileUploadList.length) {
      const alreadyPresentFilenameList = droppedFileUploadList
        .filter((fileUpload) => isFileUploadInList(fileUpload, state.fileUploadList))
        .map(fileUpload => fileUpload.file.name)
      sendGlobalFlashMessage(
        <div>
          {props.t('Files already added:')}<br />
          <ul>{alreadyPresentFilenameList.map(filename => <li key={filename}>{filename}</li>)}</ul>
        </div>
      )
    }
    if (state.fileUploadList.length === 0) this.loadFileUploadPreview(droppedFileUploadList)
    this.setState({ fileUploadList: [...state.fileUploadList, ...addedFileUploadList] })
  }

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
    fileUpload.progress = computeProgressionPercentage(e.loaded, e.total, state.fileUploadList.length)
    const fileUploadProgressPercentage = Math.round(state.fileUploadList.reduce((accumulator, fu) => accumulator + fu.progress, 0))
    this.setState({ fileUploadProgressPercentage })
  }

  uploadFile = (fileUpload) => {
    const { props } = this
    return uploadFile(
      fileUpload,
      props.uploadUrl,
      {
        additionalFormData: props.additionalFormData,
        httpMethod: props.httpMethod,
        progressEventHandler: this.updateFileUploadProgress,
        errorMessageList: props.uploadErrorMessageList,
        defaultErrorMessage: props.defaultUploadErrorMessage || props.t('Error while uploading file')
      }
    )
  }

  handleValidate = async () => {
    const { state, props } = this

    // INFO - CH - 20210315 - this allows to handle the upload outside of this component
    if (props.onValidateOverride !== undefined) {
      props.onValidateOverride(state.fileUploadList)
      return
    }

    if (!props.uploadUrl) {
      console.error("Error in PopupUploadFile, props uploadUrl isn't set.")
      sendGlobalFlashMessage(props.t('Error while uploading file(s)'))
      return
    }

    this.setState({ uploadStarted: true })
    const fileUploadDoneList = await Promise.all(state.fileUploadList.map(this.uploadFile))
    const successfulFileUploadList = fileUploadDoneList.filter(fileUpload => !isFileUploadInErrorState(fileUpload))
    const failedFileUploadList = fileUploadDoneList.filter(isFileUploadInErrorState)

    if (failedFileUploadList.length > 0) {
      this.setState({
        fileUploadList: failedFileUploadList
      })
      sendGlobalFlashMessage(props.t('Error while uploading file(s)'))
      props.onFailure(failedFileUploadList)
    } else props.onSuccess(successfulFileUploadList)
    this.setState({ uploadStarted: false })
  }

  handleDeleteFileUpload = async fileUpload => {
    const { state } = this
    const updatedFileUploadList = state.fileUploadList.filter(fu => fu !== fileUpload)
    this.loadFileUploadPreview(updatedFileUploadList)
    this.setState({ fileUploadList: updatedFileUploadList })
  }

  handleClose = () => {
    const { props, state } = this
    if (state.uploadStarted) {
      sendGlobalFlashMessage(props.t('Please wait until the upload ends'))
      return
    }
    props.onClose()
  }

  isValidateButtonDisabled = () => {
    const { state } = this
    return (
      state.uploadStarted ||
      state.fileUploadList.length === 0 ||
      state.fileUploadList.some(isFileUploadInErrorState)
    )
  }

  loadImage = file => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)
    img.src = blobUrl
    return new Promise((resolve, reject) => {
      img.onerror = () => reject(new Error('Failed to load the image'))
      img.onload = () => {
        resolve(blobUrl)
      }
    })
  }

  loadFileUploadPreview = async (fileUploadList) => {
    try {
      if (fileUploadList.length !== 1) throw new Error()
      const file = fileUploadList[0].file
      if (!file.type.includes('image') || file.size > MAX_PREVIEW_IMAGE_SIZE) throw new Error()
      this.setState({ fileUploadPreview: await this.loadImage(file) })
    } catch {
      this.setState({ fileUploadPreview: FILE_PREVIEW_STATE.NO_FILE })
    }
  }

  render () {
    const { props, state } = this

    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={props.label}
        customColor={props.color}
        faIcon={props.faIcon}
        contentName={this.isValidateButtonDisabled() ? '' : 'allowValidate'} // hack to update the "disabled" state of the button
        onChangeContentName={() => {}}
        onCreateBoardClick={props.onCreateBoardClick}
        btnValidateLabel={props.validateLabel || props.t('Validate')}
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
  uploadUrl: PropTypes.string,
  faIcon: PropTypes.string,
  httpMethod: PropTypes.string,
  color: PropTypes.string.isRequired,
  multipleFiles: PropTypes.bool,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  onClose: PropTypes.func,
  additionalFormData: PropTypes.object,
  allowedMimeTypes: PropTypes.array,
  maximumFileSize: PropTypes.number,
  uploadErrorMessageList: PropTypes.array,
  defaultUploadErrorMessage: PropTypes.string,
  validateLabel: PropTypes.string,
  onValidateOverride: PropTypes.func
}

PopupUploadFile.defaultProps = {
  uploadUrl: '',
  additionalFormData: {},
  multipleFiles: false,
  faIcon: 'fas fa-upload',
  httpMethod: 'POST',
  maximumFileSize: 0,
  onSuccess: () => {},
  onFailure: () => {},
  onClose: () => {},
  uploadErrorMessageList: [],
  onValidateOverride: undefined
}

export default translate()(TracimComponent(PopupUploadFile))
