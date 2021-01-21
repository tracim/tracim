import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  addAllResourceI18n,
  CUSTOM_EVENT,
  buildHeadTitle,
  TracimComponent,
  putMyselfFileRead,
  PopupUploadFile
} from 'tracim_frontend_lib'
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
      folderId: props.data ? props.data.folderId : debug.folderId
    }
    this.createFileUrl = `${props.data.config.apiUrl}/workspaces/${props.data.workspaceId}/files`

    // INFO - CH - 2018-08-28 - i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  // File specific ??
  handleAllAppChangeLanguage = data => {
    const { state, props } = this
    console.log('%c<PopupCreateFile> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)

    props.appContentCustomEventHandlerAllAppChangeLanguage(
      data, this.setState.bind(this), i18n, state.timelineWysiwyg
    )
    this.setHeadTitle()
  }

  // File specific
  componentDidMount () {
    this.setHeadTitle()
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  setHeadTitle = () => {
    const { state, props } = this

    if (state.config && state.config.workspace) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('New file'), state.config.workspace.label]) }
      })
    }
  }

  onUploadSuccess = async (fileUploadList) => {
    const { state } = this

    await Promise.all(fileUploadList.map(fileUpload => {
      return putMyselfFileRead(
        state.config.apiUrl,
        state.workspaceId,
        fileUpload.responseJson.content_id
      )
    }))

    if (fileUploadList.length !== 1) return

    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.OPEN_CONTENT_URL,
      data: {
        workspaceId: fileUploadList[0].content.workspace_id,
        contentType: state.appName,
        contentId: fileUploadList[0].content.content_id
      }
    })
  }

  handleClose = () => {
    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT,
      data: {
        name: this.state.appName
      }
    })
  }

  render () {
    const { props, state } = this

    const errorMessageList = [
      { status: 400, code: 3002, message: props.t('A content with the same name already exists') },
      { status: 400, code: 6002, message: props.t('The file is larger than the maximum file size allowed') },
      { status: 400, code: 6003, message: props.t('Error, the space exceed its maximum size') },
      { status: 400, code: 6004, message: props.t('You have reach your storage limit, you cannot add new files') }
    ]
    const defaultErrorMessage = props.t('Error while creating file')
    const additionalFormData = {
      parent_id: state.folderId || 0
    }

    return (
      <PopupUploadFile
        label={props.t(state.config.creationLabel)}
        validateLabel={props.t('Validate and create')}
        uploadUrl={this.createFileUrl}
        color={state.config.hexcolor}
        icon={state.config.faIcon}
        handleClose={this.onClosePopup}
        handleSuccess={this.onUploadSuccess}
        uploadErrorMessageList={errorMessageList}
        defaultUploadErrorMessage={defaultErrorMessage}
        additionalFormData={additionalFormData}
      />
    )
  }
}

export default translate()(TracimComponent(PopupCreateFile))
