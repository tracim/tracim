import React from 'react'
import { translate } from 'react-i18next'
import {
  addAllResourceI18n,
  appContentFactory,
  buildHeadTitle,
  CardPopupCreateContent,
  CUSTOM_EVENT,
  handleFetchResult,
  TracimComponent
} from 'tracim_frontend_lib'
import { postHtmlDocContent } from '../action.async.js'
import i18n from '../i18n.js'
// FIXME - GB - 2019-07-04 - The debug process for creation popups are outdated
// https://github.com/tracim/tracim/issues/2066
import { debug } from '../debug.js'

class PopupCreateHtmlDocument extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'html-document', // must remain 'html-document' because it is the name of the react built app (which contains HtmlDocument and PopupCreateHtmlDocument)
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      workspaceId: props.data ? props.data.workspaceId : debug.workspaceId,
      folderId: props.data ? props.data.folderId : debug.folderId,
      newContentName: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  // Custom Event Handlers
  handleAllAppChangeLanguage = data => {
    console.log('%c<PopupCreateHtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, data)

    this.props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
    this.setHeadTitle()
  }

  componentDidMount () {
    this.setHeadTitle()
  }

  setHeadTitle = () => {
    const { state, props } = this

    if (state.config && state.config.workspace) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('New note'), state.config.workspace.label]) }
      })
    }
  }

  handleChangeNewContentName = e => this.setState({ newContentName: e.target.value })

  handleClose = () => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT,
    data: {
      name: this.state.appName
    }
  })

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  handleValidate = async () => {
    const { config, appName, workspaceId, folderId, newContentName } = this.state

    const fetchSaveNewHtmlDoc = postHtmlDocContent(config.apiUrl, workspaceId, folderId, config.slug, newContentName)

    const resSave = await handleFetchResult(await fetchSaveNewHtmlDoc)

    switch (resSave.apiResponse.status) {
      case 200:
        this.handleClose()

        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.OPEN_CONTENT_URL,
          data: {
            workspaceId: resSave.body.workspace_id,
            contentType: appName,
            contentId: resSave.body.content_id
            // will be open in edit mode because revision.length === 1
          }
        })
        break
      case 400:
        switch (resSave.body.code) {
          case 3002:
            this.sendGlobalFlashMessage(this.props.t('A content with the same name already exists'))
            break
        }
        break
      default: this.sendGlobalFlashMessage(this.props.t('Error while creating note'))
    }
  }

  render () {
    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={this.props.t('New note')}
        customColor={this.state.config.hexcolor}
        faIcon={this.state.config.faIcon}
        contentName={this.state.newContentName}
        onChangeContentName={this.handleChangeNewContentName}
        btnValidateLabel={this.props.t('Validate and create')}
        inputPlaceholder={this.props.t("Note's title")}
      />
    )
  }
}

export default translate()(appContentFactory(TracimComponent(PopupCreateHtmlDocument)))
