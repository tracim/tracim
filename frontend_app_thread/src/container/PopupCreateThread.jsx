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
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent
} from 'tracim_frontend_lib'
import { postThreadContent } from '../action.async.js'
import { debug } from '../debug.js'

class PopupCreateThread extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'thread', // must remain 'thread' because it is the name of the react built app (which contains Threac and PopupCreateThread)
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

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentCreated }
    ])
  }

  componentDidMount () {
    this.setHeadTitle()
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<PopupCreateThread> Custom event', 'color: #28a745', CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, data)

    this.props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
    this.setHeadTitle()
  }

  handleContentCreated = data => {
    const { state } = this

    if (Number(data.content.parent_id) !== Number(state.folderId) ||
      state.loggedUser.user_id !== data.author.user_id ||
      state.newContentName !== data.content.label
    ) return

    this.handleClose()

    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.OPEN_CONTENT_URL,
      data: {
        workspaceId: data.content.workspace_id,
        contentType: state.appName,
        contentId: data.content.content_id
      }
    })
  }

  setHeadTitle = () => {
    const { state, props } = this

    if (state.config && state.config.system && state.config.system.config && state.config.workspace) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('New Thread'), state.config.workspace.label, state.config.system.config.instance_name]) }
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

    const fetchSaveThreadDoc = postThreadContent(
      state.config.apiUrl, state.workspaceId, state.folderId, state.config.slug, state.newContentName
    )

    const resSave = await handleFetchResult(await fetchSaveThreadDoc)

    switch (resSave.apiResponse.status) {
      case 200: break
      case 400:
        switch (resSave.body.code) {
          case 3002:
            this.sendGlobalFlashMessage(props.t('A content with the same name already exists'))
            break
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while creating thread'))
    }
  }

  render () {
    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={this.props.t('New Thread')} // @TODO get the lang of user
        customColor={this.state.config.hexcolor}
        faIcon={this.state.config.faIcon}
        contentName={this.state.newContentName}
        onChangeContentName={this.handleChangeNewContentName}
        btnValidateLabel={this.props.t('Validate and create')}
        inputPlaceholder={this.props.t("Topic's subject")}
      />
    )
  }
}

export default translate()(appContentFactory(TracimComponent(PopupCreateThread)))
