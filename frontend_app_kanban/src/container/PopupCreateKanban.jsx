import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  addAllResourceI18n,
  CardPopupCreateContent,
  handleFetchResult,
  CUSTOM_EVENT,
  buildHeadTitle,
  appContentFactory,
  TracimComponent,
  postNewEmptyContent
} from 'tracim_frontend_lib'
import { debug } from '../debug.js'

class PopupCreateKanban extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'kanban', // must remain 'kanban' because it is the name of the react built app (which contains Kanban and PopupCreateKanban)
      config: param.config,
      loggedUser: param.loggedUser,
      workspaceId: param.workspaceId,
      folderId: param.folderId,
      newContentName: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  componentDidMount () {
    this.setHeadTitle()
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<PopupCreateKanban> Custom event', 'color: #28a745', CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, data)

    this.props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
    this.setHeadTitle()
  }

  setHeadTitle = () => {
    const { state, props } = this

    if (state.config && state.config.workspace) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('New Kanban board'), state.config.workspace.label]) }
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
    const { props, state } = this

    const fetchSaveKanbanDoc = postNewEmptyContent(
      state.config.apiUrl, state.workspaceId, state.folderId, state.config.slug, state.newContentName
    )

    const resSave = await handleFetchResult(await fetchSaveKanbanDoc)

    switch (resSave.apiResponse.status) {
      case 200:
        this.handleClose()

        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.OPEN_CONTENT_URL,
          data: {
            workspaceId: resSave.body.workspace_id,
            contentType: state.appName,
            contentId: resSave.body.content_id
          }
        })
        break
      case 400:
        switch (resSave.body.code) {
          case 3002:
            this.sendGlobalFlashMessage(props.t('A content with the same name already exists'))
            break
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while creating kanban'))
    }
  }

  render () {
    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={this.props.t('New Kanban board')} // @TODO get the lang of user
        customColor={this.state.config.hexcolor}
        faIcon={this.state.config.faIcon}
        contentName={this.state.newContentName}
        onChangeContentName={this.handleChangeNewContentName}
        btnValidateLabel={this.props.t('Validate and create')}
        inputPlaceholder={this.props.t("Board's name")}
      />
    )
  }
}

export default translate()(appContentFactory(TracimComponent(PopupCreateKanban)))
