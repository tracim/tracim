import React from 'react'
import { translate } from 'react-i18next'
import {
  CONTENT_TYPE,
  CUSTOM_EVENT,
  addAllResourceI18n,
  appContentFactory,
  buildHeadTitle,
  CardPopupCreateContent,
  handleFetchResult,
  sendGlobalFlashMessage,
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

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'html-document', // must remain 'html-document' because it is the name of the react built app (which contains HtmlDocument and PopupCreateHtmlDocument)
      config: param.config,
      folderId: param.folderId,
      loggedUser: param.loggedUser,
      newContentName: '',
      templateId: null,
      templateList: [],
      workspaceId: param.workspaceId
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
    this.props.getTemplateList(this.setState.bind(this), CONTENT_TYPE.HTML_DOCUMENT, this.state.workspaceId)
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

  onChangeTemplate = (template, { action }) => {
    this.props.onChangeTemplate(this.setState.bind(this), template, { action })
  }

  handleClose = () => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT,
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    const { config, appName, templateId, workspaceId, folderId, newContentName } = this.state

    const fetchSaveNewHtmlDoc = postHtmlDocContent(
      config.apiUrl, workspaceId, folderId, config.slug, newContentName, templateId
    )

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
            sendGlobalFlashMessage(this.props.t('A content with the same name already exists'))
            break
        }
        break
      default: sendGlobalFlashMessage(this.props.t('Error while creating note'))
    }
  }

  render () {
    return (
      <CardPopupCreateContent
        btnValidateLabel={this.props.t('Validate and create')}
        contentName={this.state.newContentName}
        customColor={this.state.config.hexcolor}
        displayTemplateList
        faIcon={this.state.config.faIcon}
        inputPlaceholder={this.props.t("Note's title")}
        label={this.props.t('New note')}
        onChangeContentName={this.handleChangeNewContentName}
        onChangeTemplate={this.onChangeTemplate}
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        templateList={this.state.templateList}
        templateId={this.state.templateId}
      />
    )
  }
}

export default translate()(appContentFactory(TracimComponent(PopupCreateHtmlDocument)))
