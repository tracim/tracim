import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import { CardPopupCreateContent } from '../component/CardPopup/CardPopupCreateContent.jsx'
import { TracimComponent } from '../tracimComponent.js'
import { FileDropzone } from '../component/FileDropzone/FileDropzone.jsx'
import { FileUploadList } from '../component/FileDropzone/FileUploadList.jsx'
import {
  computeProgressionPercentage,
  setupCommonRequestHeaders,
  FILE_PREVIEW_STATE
} from '../helper.js'
import {
  CUSTOM_EVENT
} from '../customEvent.js'
import PopupProgressUpload from './PopupProgressUpload.jsx'

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

    const droppedFileUploadList = droppedFileList.map(f => { return { file: f, progress: 0, errorMessage: '', status: null, json: null } })

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

  isFileUploadInErrorStatus = (fileUpload) => fileUpload.status && fileUpload.status >= 400

  updateFileUploadProgress = (e, fileUpload) => {
    const { state } = this
    if (!e.lengthComputable) return
    fileUpload.percent = computeProgressionPercentage(e.loaded, e.total, state.fileUploadList.length)
    const fileUploadProgressPercentage = Math.round(state.fileUploadList.reduce((accumulator, fu) => accumulator + fu.percent, 0))
    this.setState({ fileUploadProgressPercentage })
  }

  postFile = async (fileUpload) => {
    return new Promise((resolve, reject) => {
      const { props } = this

      const formData = new FormData()
      formData.append('files', fileUpload.file)
      for (const entry of Object.entries(props.additionalFormData)) {
        formData.append(entry[0], entry[1])
      }

      // INFO - CH - 2018-08-28 - fetch still doesn't handle event progress. So we need to use old school xhr object
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', e => this.updateFileUploadProgress(e, fileUpload), false)

      xhr.open('POST', props.postFileUrl, true)
      setupCommonRequestHeaders(xhr)
      xhr.withCredentials = true

      xhr.onerror = () => reject(new Error())

      xhr.onload = () => resolve(xhr)

      xhr.send(formData)
    })
  }

  handleValidate = async () => {
    const { state, props } = this

    this.setState({ uploadStarted: true })
    try {
      const fileUploadDoneList = await Promise.all(state.fileUploadList.map(this.uploadFile))
      const successfulFileUploadList = fileUploadDoneList.filter(fileUpload => !this.isFileUploadInErrorStatus(fileUpload))
      const failedFileUploadList = fileUploadDoneList.filter(this.isFileUploadInErrorStatus)

      if (failedFileUploadList.length >= 0) {
        this.setState({
          uploadFileList: failedFileUploadList
        })
        props.handleFailure(failedFileUploadList)
      } else props.handleSuccess(successfulFileUploadList)
    } catch {
      this.sendGlobalFlashMessage(props.t('Error while creating file'))
      props.handleFailure()
    }
    this.setState({ uploadStarted: false })
  }

  uploadFile = async (fileUpload) => {
    const xhr = await this.postFile(fileUpload)
    return {
      ...fileUpload,
      json: JSON.parse(xhr.responseText),
      status: xhr.status
    }
  }

  handleDeleteFileUpload = (fileUpload) => {
    const { state } = this

    const updatedFileUploadList = state.fileUploadList.filter(fu => fu === fileUpload)
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
    return state.fileUploadList.length === 0 || state.uploadStarted || state.fileUploadList.some(this.isFileUploadInErrorStatus)
  }

  loadUploadFilePreview = (file) => {
    if (!file.type.includes('image') || file.size > 2000000) return

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
        faIcon={state.config.faIcon}
        contentName={this.isValidateButtonDisabled() ? '' : 'allowValidate'} // hack to update the "disabled" state of the button
        onChangeContentName={() => {}}
        btnValidateLabel={props.t('Validate and create')}
        customStyle={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <div>
          {state.uploadStarted && (
            <PopupProgressUpload
              color={state.config.hexcolor}
              percent={state.fileUploadProgressPercentage}
            />
          )}
          <FileDropzone
            onDrop={this.handleDropFile}
            hexcolor={props.color}
            preview={state.fileUploadPreview}
            multipleFiles={props.multipleFilesUploadEnabled}
          />

          {props.multipleFileUploadEnabled} && (
          <FileUploadList
            fileUploadList={state.fileUploadList}
            onDeleteFile={this.handleDeleteFile}
            deleteFileDisabled={state.uploadStarted}
          />)
        </div>
      </CardPopupCreateContent>
    )
  }
}

PopupUploadFile.propTypes = {
  label: PropTypes.string.isRequired,
  postFileUrl: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  multipleFileUploadEnabled: PropTypes.boolean,
  handleSuccess: PropTypes.func,
  handleFailure: PropTypes.func,
  handleClose: PropTypes.func,
  additionalFormData: PropTypes.object
}

PopupUploadFile.defaultProps = {
  additionalFormData: {},
  multipleFileUploadEnabled: false,
  handleSuccess: () => {},
  handleFailure: () => {},
  handleClose: () => {}
}

export default translate()(TracimComponent(PopupUploadFile))
