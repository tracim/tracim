import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  addAllResourceI18n,
  FileDropzone,
  CUSTOM_EVENT,
  displayFileSize
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
        this.setState({ uploadFiles: uploadedFiles, uploadedFiles: [], uploadStarted: false })
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

  handleChangeFile = newFile => {
    if (!newFile || !newFile[0]) return

    const fileToSave = newFile

    // if (
    //   !fileToSave.type.includes('image') ||
    //   fileToSave.size > 2000000
    // ) {
    // this.setState({
    //   uploadFile: fileToSave,
    //   uploadFilePreview: false
    // })
    //   const uploadFiles = this.state.uploadFiles
    //   uploadFiles.push(fileToSave)
    //   this.setState({ uploadFiles, uploadFilePreview: false })
    //   return
    // }
    fileToSave.forEach(f => f.percent = 0)
    const uploadFiles = this.state.uploadFiles
    uploadFiles.push(...fileToSave)
    this.setState({ uploadFiles })

    // var reader = new FileReader()
    // reader.onload = e => {
    //   this.setState({ uploadFilePreview: e.total > 0 ? e.target.result : false })
    //   const img = new Image()
    //   img.src = e.target.result
    //   img.onerror = () => this.setState({ uploadFilePreview: false })
    // }
    // reader.readAsDataURL(fileToSave)
  }

  handleClose = () => {
    const { state, props } = this

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
    // xhr.upload.addEventListener('loadstart', () => this.setState({ progressUpload: { display: false } }), false)
    const uploadInProgress = e => {
      if (e.lengthComputable) {
        const uploadFiles = state.uploadFiles
        uploadFiles[uploadFiles.indexOf(file)].percent += (e.loaded / e.total * 100) / uploadFiles.length

        this.setState({
          progressUpload: {
            display: true
          },
          uploadFiles
        })
      }
    }
    xhr.upload.addEventListener('progress', uploadInProgress, false)
    // xhr.upload.addEventListener('load', () => this.setState({ progressUpload: { display: false } }), false)

    xhr.open('POST', `${state.config.apiUrl}/workspaces/${state.workspaceId}/files`, true)

    xhr.setRequestHeader('Accept', 'application/json')
    xhr.withCredentials = true

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        const uploadedFiles = state.uploadedFiles
        switch (xhr.status) {
          case 200:
            const jsonResult200 = JSON.parse(xhr.responseText)

            // file.jsonResult = jsonResult200
            // this.handleClose()

            // GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })

            // if (state.uploadFiles.length === 1) {
            //   GLOBAL_dispatchEvent({
            //     type: CUSTOM_EVENT.OPEN_CONTENT_URL,
            //     data: {
            //       workspaceId: jsonResult200.workspace_id,
            //       contentType: state.appName,
            //       contentId: jsonResult200.content_id
            //     }
            //   })
            // }
            // uploadFile.splice(uploadFile.indexOf(file), 1)
            // uploadFile[uploadFile.indexOf(file)].jsonResult = jsonResult200
            filePosted.jsonResult = { ...jsonResult200, code: 200 }

            uploadedFiles.push(filePosted)

            this.setState({ uploadedFiles })
            break
          case 400:
            const jsonResult400 = JSON.parse(xhr.responseText)

            let hasError = ''
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
          default: this.sendGlobalFlashMessage(props.t('Error while creating file')); break
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

  onDeleteFile = (file) => {
    const { state } = this

    const uploadFiles = state.uploadFiles
    uploadFiles.splice(uploadFiles.indexOf(file), 1)

    this.setState({ uploadFiles })
  }

  getPercentUpload () {
    const { state } = this

    return Math.round(state.uploadFiles.reduce((accumulator, currentValue) => accumulator + currentValue.percent, 0))
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
        contentName={state.uploadFiles.length > 0 ? 'allowValidate' : ''} // hack to update the "disabled" state of the button
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
            preview={state.uploadFilePreview}
          />

          <div className='font-weight-bold'>
            {state.uploadFiles.length > 0
              ? props.t('Attached files')
              : props.t('You have not yet chosen any files to upload.')
            }
          </div>

          <div className='guestupload__card__form__right__files'>
            {state.uploadFiles.map((file, index) =>
              <div className='d-flex' key={file.name}>
                <i className='fa fa-fw fa-file-o m-1' />

                {file.name} ({displayFileSize(file.size)})

                <button
                  className='iconBtn ml-auto primaryColorFontHover'
                  onClick={() => this.onDeleteFile(file)}
                  title={props.t('Delete')}
                >
                  <i className='fa fa-fw fa-trash-o' />
                </button>
                {file.hasError && (
                  <i title={file.hasError} className='fa fa-fw fa-exclamation-triangle create_file_error'/>
                )}
              </div>
            )}
          </div>
        </div>
      </CardPopupCreateContent>
    )
  }
}

export default translate()(PopupCreateFile)
