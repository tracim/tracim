import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  handleFetchResult,
  addAllResourceI18n,
  RadioBtnGroup,
  buildHeadTitle,
  CUSTOM_EVENT,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  postCollaborativeDocumentFromTemplate,
  getCollaborativeDocumentTemplates
} from '../action.async.js'
import i18n from '../i18n.js'
import {
  getAvaibleFileTypes,
  getTemplateFromFileType,
  getIconUrlFromFileType,
  getTranslationFromFileType,
  getExtensionFromFileType
} from '../helper.js'
import { debug } from '../debug.js'

export class PopupCreateCollaborativeDocument extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug

    this.state = {
      appName: 'collaborative_document_edition',
      config: param.config,
      loggedUser: param.loggedUser,
      workspaceId: param.workspaceId,
      folderId: param.folderId,
      newContentName: '',
      availableFileTypes: [],
      availableTemplates: [],
      selectedOption: '',
      software: '',
      externalTranslationList: [
        props.t('Create an office document')
      ]
    }
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  componentDidMount () {
    this.setHeadTitle()
    this.setDocumentOptions()
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<PopupCreateOfficeDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)

    this.props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
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
        data: { title: buildHeadTitle([props.t('New Office document'), state.config.workspace.label]) }
      })
    }
  }

  handleClose = () => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT, // handled by tracim_front:dist/index.html
    data: {
      name: this.state.appName
    }
  })

  handleInputKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        this.handleValidate()
        break
      case 'Escape':
        e.preventDefault()
        this.handleClose()
        break
    }
  }

  handleChangeNewContentName = e => this.setState({ newContentName: e.target.value })

  handleValidate = async () => {
    const { state, props } = this
    const { PAGE } = this.props.data.config

    const templateName = getTemplateFromFileType(state.software, state.selectedOption.value, state.availableTemplates)
    const filename = state.newContentName + getExtensionFromFileType(state.software, state.selectedOption.value)
    const request = postCollaborativeDocumentFromTemplate(
      state.config.apiUrl, state.workspaceId, state.folderId, state.config.slug, filename, templateName
    )

    const response = await handleFetchResult(await request)

    switch (response.apiResponse.status) {
      case 200:
        this.handleClose()
        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.REDIRECT,
          data: { url: PAGE.WORKSPACE.CONTENT_EDITION(response.body.workspace_id, response.body.content_id) }
        })
        break
      case 400:
        switch (response.body.code) {
          case 3002:
            this.sendGlobalFlashMessage(props.t('A content with the same name already exists'))
            break
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while creating document'))
    }
  }

  getAvailableTemplates = async () => {
    const { state } = this
    const request = getCollaborativeDocumentTemplates(state.config.apiUrl, state.workspaceId)
    const response = await handleFetchResult(await request)
    switch (response.apiResponse.status) {
      case 200: return response.body.file_templates
      default: return []
    }
  }

  setDocumentOptions = async () => {
    const availableTemplates = await this.getAvailableTemplates()
    const software = this.state.config.system.config.collaborative_document_edition.software
    const availableFileTypes = getAvaibleFileTypes(software, availableTemplates)
    this.setState({
      availableTemplates: availableTemplates,
      availableFileTypes: availableFileTypes,
      software: software
    })
  }

  setSelectedOption = fileType => this.setState({ selectedOption: fileType })

  buildOptions () {
    const { props, state } = this

    return state.availableFileTypes.map((fileType) => ({
      text: props.t(getTranslationFromFileType(state.software, fileType)),
      value: fileType,
      img: {
        alt: fileType,
        src: getIconUrlFromFileType(state.software, fileType),
        height: 52,
        width: 52
      }
    }))
  }

  render () {
    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={this.props.t('New Office Document')}
        customColor={this.state.config.hexcolor}
        faIcon={this.state.config.faIcon}
        btnValidateLabel={this.props.t('Validate and create')}
        contentName={this.state.newContentName}
      >
        <input
          type='text'
          className='createcontent__form__input'
          data-cy='createcontent__form__input'
          placeholder={this.props.t("Office Document's title")}
          value={this.state.newContentName}
          onChange={this.handleChangeNewContentName}
          onKeyDown={this.handleInputKeyDown}
          autoFocus
        />
        <RadioBtnGroup
          data-cy='popup__office__radiogrp'
          options={this.buildOptions()}
          handleNewSelectedValue={this.setSelectedOption}
          customColor={this.state.config.hexcolor}
          onKeyDown={this.handleInputKeyDown}
        />
      </CardPopupCreateContent>
    )
  }
}

export default translate()(TracimComponent(PopupCreateCollaborativeDocument))
