import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  handleFetchResult,
  addAllResourceI18n,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import { postWorkspace } from '../action.async.js'
import i18n from '../i18n.js'
import { debug } from '../debug.js'

class PopupCreateWorkspace extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'workspace',
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      newWorkspaceName: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  componentWillUnmount () {
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<PopupCreateWorkspace> Custom event', 'color: #28a745', type, data)
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

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  handleChangeNewWorkspaceName = e => this.setState({newWorkspaceName: e.target.value})

  handleClose = () => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.HIDE_POPUP_CREATE_WORKSPACE, // handled by tracim_front:dist/index.html
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    const { props, state } = this

    const fetchSaveNewWorkspace = await handleFetchResult(await postWorkspace(state.config.apiUrl, state.newWorkspaceName))

    switch (fetchSaveNewWorkspace.apiResponse.status) {
      case 200:
        this.handleClose()
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_WORKSPACE_LIST, data: {openIdInSidebar: fetchSaveNewWorkspace.body.workspace_id} })
        GLOBAL_dispatchEvent({type: CUSTOM_EVENT.REDIRECT, data: {url: `/ui/workspaces/${fetchSaveNewWorkspace.body.workspace_id}/dashboard`}})
        break
      case 400:
        switch (fetchSaveNewWorkspace.body.code) {
          case 3007: this.sendGlobalFlashMessage(props.t('A shared space with that name already exists')); break
          default: this.sendGlobalFlashMessage(props.t('Error while saving new shared space')); break
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new shared space')); break
    }
  }

  render () {
    const { props, state } = this
    return (
      <CardPopupCreateContent
        customColor={state.config.hexcolor}
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={props.t('New shared space')}
        faIcon={state.config.faIcon}
        contentName={state.newWorkspaceName}
        onChangeContentName={this.handleChangeNewWorkspaceName}
        btnValidateLabel={props.t('Validate and create')}
        inputPlaceholder={props.t("Shared space's name")}
      />
    )
  }
}

export default translate()(PopupCreateWorkspace)
