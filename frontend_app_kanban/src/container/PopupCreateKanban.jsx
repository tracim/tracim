import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  CONTENT_TYPE,
  CUSTOM_EVENT,
  addAllResourceI18n,
  CardPopupCreateContent,
  handleFetchResult,
  buildHeadTitle,
  appContentFactory,
  TracimComponent,
  postRawFileContent
} from 'tracim_frontend_lib'

import { KANBAN_MIME_TYPE, KANBAN_FILE_EXTENSION } from '../helper.js'
import { debug } from '../debug.js'

const defaultKanbanBoard = {
  columns: []
}

export class PopupCreateKanban extends React.Component {
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
      newContentName: '',
      templateList: []
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
    this.props.getTemplateList(this.setState.bind(this), CONTENT_TYPE.KANBAN)
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

  handleChangeTemplate = (template) => {
    this.setState({ templateId: template.content_id })
    if (this.state.newContentName === '') {
      this.setState({ newContentName: template.label })
    }
  }

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

    const fetchSaveKanbanDoc = postRawFileContent(
      state.config.apiUrl,
      state.workspaceId,
      state.newContentName + KANBAN_FILE_EXTENSION,
      JSON.stringify(defaultKanbanBoard),
      KANBAN_MIME_TYPE,
      state.folderId,
      state.config.slug
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
          case 6002:
            this.sendGlobalFlashMessage(props.t('The file is larger than the maximum file size allowed'))
            break
          case 6003:
            this.sendGlobalFlashMessage(props.t('Error, the space exceed its maximum size'))
            break
          case 6004:
            this.sendGlobalFlashMessage(props.t('You have reached your storage limit, you cannot add new files'))
            break
          default:
            this.sendGlobalFlashMessage(props.t('Error while creating kanban'))
            break
        }
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while creating kanban'))
        break
    }
  }

  render () {
    return (
      <CardPopupCreateContent
        btnValidateLabel={this.props.t('Validate and create')}
        contentName={this.state.newContentName}
        customColor={this.state.config.hexcolor}
        faIcon={this.state.config.faIcon}
        inputPlaceholder={this.props.t("Board's name")}
        label={this.props.t('New Kanban board')}
        onChangeContentName={this.handleChangeNewContentName}
        onChangeTemplate={this.handleChangeTemplate}
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        templateList={this.state.templateList}
      />
    )
  }
}

export default translate()(appContentFactory(TracimComponent(PopupCreateKanban)))
