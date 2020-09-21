import React from 'react'
import FolderAdvancedComponent from '../component/FolderAdvanced.jsx'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  getContentTypeList,
  appContentFactory,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  handleFetchResult,
  addAllResourceI18n,
  ArchiveDeleteContent,
  CUSTOM_EVENT,
  ROLE,
  buildHeadTitle,
  BREADCRUMBS_TYPE,
  RefreshWarningMessage,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent
} from 'tracim_frontend_lib'
import { debug } from '../debug.js'
import {
  getFolder,
  putFolder
} from '../action.async.js'

const filterSubContentTypes = (list) => {
  /* INFO - SG - 2020-06-18
   * Comments cannot be made on a folder, so remove them
   * from the possible content types
   */
  return list.filter(ct => ct.slug !== 'comment')
}

export class FolderAdvanced extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'folder',
      editionAuthor: '',
      showRefreshWarning: false,
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      externalTranslationList: [
        props.t('Create a folder'),
        props.t('Folder')
      ],
      tracimContentTypeList: []
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage },
      { name: CUSTOM_EVENT.SHOW_APP(param.config.slug), handler: this.handleShowApp },
      { name: CUSTOM_EVENT.HIDE_APP(param.config.slug), handler: this.handleHideApp },
      { name: CUSTOM_EVENT.RELOAD_CONTENT(param.config.slug), handler: this.handleReloadContent },
      { name: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(param.config.slug), handler: this.handleReloadAppFeatureData }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FOLDER, handler: this.handleFolderChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FOLDER, handler: this.handleFolderChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FOLDER, handler: this.handleFolderChanged }
    ])
  }

  handleAllAppChangeLanguage = async data => {
    const { props } = this
    console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
    props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
    await this.loadContent()
  }

  handleShowApp = data => {
    const { props, state } = this
    console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP(state.config.slug), data)
    props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
    if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
  }

  handleHideApp = data => {
    const { props, state } = this
    console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.HIDE_APP(state.config.slug), data)
    props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
  }

  handleReloadContent = data => {
    const { state } = this
    console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_CONTENT(state.config.slug), data)
    this.setState(prev => ({ content: { ...prev.content, ...data }, isVisible: true }))
  }

  handleReloadAppFeatureData = data => {
    const { props, state } = this
    console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(state.config.slug), data)
    props.appContentCustomEventHandlerReloadAppFeatureData(this.loadContent, this.loadTimeline)
  }

  handleFolderChanged = data => {
    const { state } = this
    if (data.fields.content.content_id !== state.content.content_id) return

    const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
    this.setState(prev => ({
      content: clientToken === data.fields.client_token ? { ...prev.content, ...data.fields.content } : prev.content,
      newContent: { ...prev.content, ...data.fields.content },
      editionAuthor: data.fields.author.public_name,
      showRefreshWarning: clientToken !== data.fields.client_token
    }))
    if (clientToken === data.fields.client_token) {
      this.setHeadTitle(data.fields.content.label)
      this.buildBreadcrumbs(data.fields.content)
    }
  }

  async componentDidMount () {
    await this.loadContent()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    if (prevState.content.content_id !== state.content.content_id) {
      await this.loadContent()
    }
  }

  sendGlobalFlashMessage = (msg, type = 'info') => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: type,
      delay: undefined
    }
  })

  setHeadTitle = (folderName) => {
    const { state } = this

    if (state.config && state.config.workspace && state.isVisible) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([folderName, state.config.workspace.label]) }
      })
    }
  }

  loadContent = async () => {
    const { props, state } = this
    const fetchFolder = await handleFetchResult(await getFolder(state.config.apiUrl, state.content.workspace_id, state.content.content_id))
    const fetchContentTypeList = await handleFetchResult(await getContentTypeList(state.config.apiUrl))

    switch (fetchFolder.apiResponse.status) {
      case 200:
        this.setState({ content: fetchFolder.body })
        this.setHeadTitle(fetchFolder.body.label)
        this.buildBreadcrumbs(fetchFolder.body)
        break
      default: this.sendGlobalFlashMessage(props.t('Error while loading folder details'), 'warning')
    }

    switch (fetchContentTypeList.apiResponse.status) {
      case 200: this.setState({ tracimContentTypeList: filterSubContentTypes(fetchContentTypeList.body) }); break
      default: this.sendGlobalFlashMessage(props.t("Error while loading Tracim's content type list"), 'warning')
    }
  }

  loadTimeline = () => {}

  buildBreadcrumbs = (content) => {
    const { state } = this

    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.APPEND_BREADCRUMBS,
      data: {
        breadcrumbs: [{
          url: `/ui/workspaces/${content.workspace_id}/contents/${state.config.slug}/${content.content_id}`,
          label: content.label,
          link: null,
          type: BREADCRUMBS_TYPE.APP_FEATURE
        }]
      }
    })
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleSaveEditLabel = async newTitle => {
    const { props, state } = this
    await props.appContentChangeTitle(state.content, newTitle, state.config.slug, { sub_content_types: state.content.sub_content_types })
  }

  handleClickCheckbox = async appSlug => {
    const { props, state } = this

    // FIXME - G.B. - 2019-08-14 - We need a sub-app system so you don't have to put the hardcoded strings
    const APP_FILE_SLUG = 'file'
    const APP_COLLABORATIVE_DOCUMENT_SLUG = 'collaborative_document_edition'

    const oldAvailableAppList = state.content.sub_content_types

    let newAvailableAppList = []

    if (state.content.sub_content_types.find(c => c === appSlug)) {
      newAvailableAppList = state.content.sub_content_types.filter(c => c !== appSlug)
      if (appSlug === APP_FILE_SLUG) {
        newAvailableAppList = newAvailableAppList.filter(c => c !== APP_COLLABORATIVE_DOCUMENT_SLUG)
      }
    } else {
      newAvailableAppList = [...state.content.sub_content_types, appSlug]
      if (appSlug === APP_COLLABORATIVE_DOCUMENT_SLUG) {
        newAvailableAppList = [...newAvailableAppList, APP_FILE_SLUG]
      }
    }

    this.setState(prev => ({ content: { ...prev.content, sub_content_types: newAvailableAppList } }))

    const fetchPutWorkspaceLabel = await handleFetchResult(
      await putFolder(state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.label, '', newAvailableAppList)
    )

    switch (fetchPutWorkspaceLabel.apiResponse.status) {
      case 200:
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while saving new available apps list'), 'warning')
        this.setState(prev => ({ content: { ...prev.content, sub_content_types: oldAvailableAppList } }))
        break
    }
  }

  handleClickArchive = async () => {
    const { props, state } = this
    props.appContentArchive(state.content, this.setState.bind(this), state.config.slug)
  }

  handleClickDelete = async () => {
    const { props, state } = this
    props.appContentDelete(state.content, this.setState.bind(this), state.config.slug)
  }

  handleClickRestoreArchive = async () => {
    const { props, state } = this
    props.appContentRestoreArchive(state.content, this.setState.bind(this), state.config.slug)
  }

  handleClickRestoreDelete = async () => {
    const { props, state } = this
    props.appContentRestoreDelete(state.content, this.setState.bind(this), state.config.slug)
  }

  handleClickRefresh = () => {
    this.setState(prev => ({
      content: {
        ...prev.content,
        ...prev.newContent
      },
      showRefreshWarning: false
    }))
    this.setHeadTitle(this.state.newContent.label)
  }

  render () {
    const { props, state } = this

    if (!state.isVisible) return null

    return (
      <PopinFixed customClass='folder_advanced'>
        <PopinFixedHeader
          customClass='folderAdvanced'
          customColor={state.config.hexcolor}
          faIcon={state.config.faIcon}
          rawTitle={state.content.label}
          componentTitle={<div>{state.content.label}</div>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditLabel}
        />

        <PopinFixedOption>
          <div className='folder_advanced__header'>
            {state.showRefreshWarning && (
              <RefreshWarningMessage
                tooltip={props.t('The content has been modified by {{author}}', { author: state.editionAuthor, interpolation: { escapeValue: false } })}
                onClickRefresh={this.handleClickRefresh}
              />
            )}

            <div className='folder_advanced__header__deleteButton'>
              {/* state.loggedUser.userRoleIdInWorkspace >= 2 &&
                <SelectStatus
                  selectedStatus={state.config.availableStatuses.find(s => s.slug === state.content.status)}
                  availableStatus={state.config.availableStatuses}
                  onChangeStatus={this.handleChangeStatus}
                  disabled={state.content.is_archived || state.content.is_deleted}
                />
              */}

              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id && (
                <ArchiveDeleteContent
                  customColor={state.config.hexcolor}
                  onClickArchiveBtn={this.handleClickArchive}
                  onClickDeleteBtn={this.handleClickDelete}
                  disabled={state.content.is_archived || state.content.is_deleted}
                />
              )}
            </div>
          </div>
        </PopinFixedOption>

        <PopinFixedContent customClass={`${state.config.slug}__contentpage`}>
          <FolderAdvancedComponent
            folderSubContentType={state.content.sub_content_types || []}
            tracimContentTypeList={state.tracimContentTypeList}
            onClickApp={this.handleClickCheckbox}
            isArchived={state.content.is_archived}
            isDeleted={state.content.is_deleted}
            onClickRestoreArchived={this.handleClickRestoreArchive}
            onClickRestoreDeleted={this.handleClickRestoreDelete}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(appContentFactory(TracimComponent(FolderAdvanced)))
