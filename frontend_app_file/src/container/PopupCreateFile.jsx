import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  handleFetchResult,
  addAllResourceI18n
} from 'tracim_frontend_lib'
import {
  postFileContent,
  putFileContentRaw
} from '../action.async.js'
import i18n from '../i18n.js'
import { debug } from '../helper.js'
import FileDropzone from '../component/FileDropzone.jsx'

class PopupCreateFile extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'file', // must remain 'file' because it is the name of the react built app (which contains File and PopupCreateFile)
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      idWorkspace: props.data ? props.data.idWorkspace : debug.idWorkspace,
      idFolder: props.data ? props.data.idFolder : debug.idFolder,
      uploadFile: ''
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

  handleChangeFile = files => {
    this.setState({uploadFile: files[0]})
  }

  handleClose = () => GLOBAL_dispatchEvent({
    type: 'hide_popupCreateContent', // handled by tracim_front:dist/index.html
    data: {
      name: this.state.appName
    }
  })

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

    const fetchPostContent = await handleFetchResult(postFileContent(state.loggedUser, state.config.apiUrl, state.idWorkspace, state.idFolder, 'file', state.uploadFile.name))
    switch (fetchPostContent.apiResponse.status) {
      case 200:
        const newIdContent = fetchPostContent.body.content_id

        const formData = new FormData()
        formData.append('files', state.uploadFile)

        const fetchPutRaw = await handleFetchResult(putFileContentRaw(state.loggedUser, state.config.apiUrl, state.idWorkspace, newIdContent, formData))
        switch (fetchPutRaw.status) {
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
            })
            break
          default: displayFlashMsgError()
        }
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
        label={state.config.creationLabel}
        customColor={state.config.hexcolor}
        faIcon={state.config.faIcon}
        contentName={state.uploadFile ? 'allowValidate' : ''} // hack to update the "disabled" state of the button
        onChangeContentName={() => {}}
        btnValidateLabel={props.t('Validate and create')}
      >
        <FileDropzone
          onDrop={this.handleChangeFile}
          onClick={this.handleChangeFile}
          hexcolor={state.config.hexcolor}
        />
      </CardPopupCreateContent>
    )
  }
}

export default translate()(PopupCreateFile)
