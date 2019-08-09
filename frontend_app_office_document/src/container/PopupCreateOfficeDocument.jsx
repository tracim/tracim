import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  handleFetchResult,
  addAllResourceI18n,
  RadioBtnGroup,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import {
  postOfficeDocumentFromTemplate,
  getOfficeDocumentTemplates
} from '../action.async.js'
import i18n from '../i18n.js'
import {
  getAvaibleFileTypes,
  getTemplateFromFileType,
  getIconUrlFromFileType,
  getTranslationFromFileType,
  getExtensionFromFileType
} from '../helper.js'

class PopupCreateOfficeDocument extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'office_document',
      config: props.data.config,
      loggedUser: props.data.loggedUser,
      workspaceId: props.data.workspaceId,
      folderId: props.data.folderId,
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
  }

  componentDidMount () {
    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
    this.setDocumentOptions()
  }

  componentWillUnmount () {
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<PopupCreateOfficeDocument> Custom event', 'color: #28a745', type, data)
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
    const { config, workspaceId, folderId, newContentName, availableTemplates, selectedOption, software } = this.state
    const { PAGE } = this.props.data.config
    const templateName = getTemplateFromFileType(software, selectedOption.value, availableTemplates)
    const filename = newContentName + getExtensionFromFileType(software, selectedOption.value)
    const request = postOfficeDocumentFromTemplate(config.apiUrl, workspaceId, folderId, config.slug, filename, templateName)

    const response = await handleFetchResult(await request)

    switch (response.apiResponse.status) {
      case 200:
        this.handleClose()
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.REDIRECT,
          data: {
            url: PAGE.WORKSPACE.CONTENT_EDITION(response.body.workspace_id, response.body.content_id)
          }
        })
        break
      case 400:
        switch (response.body.code) {
          case 3002:
            GLOBAL_dispatchEvent({
              type: CUSTOM_EVENT.ADD_FLASH_MSG,
              data: {
                msg: this.props.t('A content with the same name already exists'),
                type: 'warning',
                delay: undefined
              }
            })
            break
        }
        break
      default: GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: this.props.t('Error while creating document'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  getAvaibleTemplates = async () => {
    const { state } = this
    const request = getOfficeDocumentTemplates(state.config.apiUrl, state.workspaceId)
    const response = await handleFetchResult(await request)
    switch (response.apiResponse.status) {
      case 200: return response.body.file_templates
      default: return []
    }
  }

  setDocumentOptions = async () => {
    const availableTemplates = await this.getAvaibleTemplates()
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

    return state.availableFileTypes.map(
      (fileType) => ({
        text: props.t(getTranslationFromFileType(state.software, fileType)),
        value: fileType,
        img: {
          alt: fileType,
          src: getIconUrlFromFileType(state.software, fileType),
          height: 52,
          width: 52
        }
      })
    )
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
        />
      </CardPopupCreateContent>
    )
  }
}

export default translate()(PopupCreateOfficeDocument)
