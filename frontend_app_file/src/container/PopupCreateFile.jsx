import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  handleFetchResult,
  addAllResourceI18n
} from 'tracim_frontend_lib'
import {
  postFileContent
} from '../action.async.js'
import i18n from '../i18n.js'
import { debug } from '../helper.js'
import FileDropzone from '../component/FileDropzone.jsx'
import PopupProgressUpload from '../component/PopupProgressUpload.jsx'

class PopupCreateFile extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'file', // must remain 'file' because it is the name of the react built app (which contains File and PopupCreateFile)
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      idWorkspace: props.data ? props.data.idWorkspace : debug.idWorkspace,
      idFolder: props.data ? props.data.idFolder : debug.idFolder,
      uploadFile: null,
      uploadFilePreview: null,
      progressUpload: {
        display: false,
        percent: 0
      }
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'allApp_changeLang':
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
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  handleChangeFile = newFile => {
    if (!newFile || !newFile[0]) return

    const fileToSave = newFile[0]
    this.setState({uploadFile: fileToSave})

    var reader = new FileReader()
    reader.onload = e => this.setState({uploadFilePreview: e.target.result})
    reader.readAsDataURL(fileToSave)
  }

  handleClose = () => {
    const { state, props } = this

    if (state.progressUpload.display) {
      GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t('Please wait until the upload ends'),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    GLOBAL_dispatchEvent({
      type: 'hide_popupCreateContent', // handled by tracim_front:dist/index.html
      data: {
        name: state.appName
      }
    })
  }

  handleValidate = async () => {
    const { state } = this

    const displayFlashMsgError = () => GLOBAL_dispatchEvent({
      type: 'addFlashMsg',
      data: {
        msg: this.props.t('Error while creating file'),
        type: 'warning',
        delay: undefined
      }
    })

    const fetchPostContent = await handleFetchResult(await postFileContent(state.config.apiUrl, state.idWorkspace, state.idFolder, 'file', state.uploadFile.name))
    switch (fetchPostContent.apiResponse.status) {
      case 200:
        const formData = new FormData()
        formData.append('files', state.uploadFile)

        // fetch still doesn't handle event progress. So we need to use old school xhr object
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('loadstart', () => this.setState({progressUpload: {display: false, percent: 0}}), false)
        const uploadInProgress = e => e.lengthComputable && this.setState({progressUpload: {display: true, percent: Math.round(e.loaded / e.total * 100)}})
        xhr.upload.addEventListener('progress', uploadInProgress, false)
        xhr.upload.addEventListener('load', () => this.setState({progressUpload: {display: false, percent: 0}}), false)

        xhr.open('PUT', `${state.config.apiUrl}/workspaces/${state.idWorkspace}/files/${fetchPostContent.body.content_id}/raw`, true)
        // xhr.setRequestHeader('Authorization', 'Basic ' + state.loggedUser.auth)
        xhr.setRequestHeader('Accept', 'application/json')
        xhr.withCredentials = true

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            switch (xhr.status) {
              case 204:
                this.handleClose()

                GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} })

                GLOBAL_dispatchEvent({
                  type: 'openContentUrl', // handled by tracim_front:src/container/WorkspaceContent.jsx
                  data: {
                    idWorkspace: fetchPostContent.body.workspace_id,
                    contentType: state.appName,
                    idContent: fetchPostContent.body.content_id
                  }
                }); break
              default: displayFlashMsgError()
            }
          }
        }

        xhr.send(formData)
        break
      default: displayFlashMsgError()
    }
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
        customStyle={{top: 'calc(50% - 202px)'}}
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
          />
        </div>
      </CardPopupCreateContent>
    )
  }
}

export default translate()(PopupCreateFile)
