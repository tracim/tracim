import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  handleFetchResult,
  addAllResourceI18n,
  CUSTOM_EVENT,
  buildHeadTitle,
  sendGlobalFlashMessage
} from 'tracim_frontend_lib'
import { postFolder } from '../action.async.js'
import i18n from '../i18n.js'
// FIXME - GB - 2019-07-04 - The debug process for creation popups are outdated
// https://github.com/tracim/tracim/issues/2066
import { debug } from '../debug.js'

class PopupCreateFolder extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'folder',
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      workspaceId: props.data ? props.data.workspaceId : debug.workspaceId,
      folderId: props.data ? props.data.folderId : debug.folderId,
      newFolderName: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  componentDidMount () {
    this.setHeadTitle()
  }

  componentWillUnmount () {
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<PopupCreateFolder> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        this.setHeadTitle()
        break
    }
  }

  setHeadTitle = () => {
    const { state, props } = this

    if (state.config && state.config.workspace) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('New folder'), state.config.workspace.label]) }
      })
    }
  }

  handleChangeNewFolderName = e => this.setState({ newFolderName: e.target.value })

  handleClose = () => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT,
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    const { props, state } = this

    const fetchSaveNewFolder = await handleFetchResult(await postFolder(state.config.apiUrl, state.workspaceId, state.folderId, state.config.slug, state.newFolderName))

    switch (fetchSaveNewFolder.apiResponse.status) {
      case 200:
        this.handleClose()
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
        // GLOBAL_dispatchEvent({type: 'redirect', data: {url: `/ui/workspaces/${fetchSaveNewFolder.body.workspace_id}/dashboard`}})
        break
      case 400:
        switch (fetchSaveNewFolder.body.code) {
          default: sendGlobalFlashMessage(props.t('Error while saving new folder')); break
        }
        break
      default: sendGlobalFlashMessage(props.t('Error while saving new folder')); break
    }
  }

  render () {
    const { props, state } = this
    return (
      <CardPopupCreateContent
        customColor={state.config.hexcolor}
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={props.t('New folder')}
        faIcon={state.config.faIcon}
        contentName={state.newFolderName}
        onChangeContentName={this.handleChangeNewFolderName}
        btnValidateLabel={props.t('Validate and create')}
        inputPlaceholder={props.t("Folder's name")}
      />
    )
  }
}

export default translate()(PopupCreateFolder)
