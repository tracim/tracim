import React from 'react'
import FolderAdvancedComponent from '../component/FolderAdvanced.jsx'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  APP_CUSTOM_ACTION_LOCATION_OBJECT,
  buildAppCustomActionLinkList,
  buildContentPathBreadcrumbs,
  CONTENT_TYPE,
  getContentTypeList,
  appContentFactory,
  handleClickCopyLink,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedContent,
  handleFetchResult,
  addAllResourceI18n,
  CUSTOM_EVENT,
  ROLE,
  buildHeadTitle,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent,
  sendGlobalFlashMessage,
  FAVORITE_STATE,
  defaultApiContent
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
    const dataWithPropertyReset = {
      ...defaultApiContent,
      ...data
    }
    this.setState(prev => ({ content: { ...prev.content, ...dataWithPropertyReset }, isVisible: true }))
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
    this.props.loadFavoriteContentList(this.state.loggedUser, this.setState.bind(this))
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    if (prevState.content.content_id !== state.content.content_id) {
      await this.loadContent()
    }
  }

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
      default: sendGlobalFlashMessage(props.t('Error while loading folder details'))
    }

    switch (fetchContentTypeList.apiResponse.status) {
      case 200: this.setState({ tracimContentTypeList: filterSubContentTypes(fetchContentTypeList.body) }); break
      default: sendGlobalFlashMessage(props.t("Error while loading Tracim's content type list"))
    }
  }

  loadTimeline = () => { }

  buildBreadcrumbs = async content => {
    try {
      const contentBreadcrumbsList = await buildContentPathBreadcrumbs(this.state.config.apiUrl, content)
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.APPEND_BREADCRUMBS,
        data: {
          breadcrumbs: contentBreadcrumbsList
        }
      })
    } catch (e) {
      console.error('Error in app folder, count not build breadcrumbs', e)
    }
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleClickCopyLink = () => {
    const { props, state } = this
    handleClickCopyLink(state.content.content_id)
    sendGlobalFlashMessage(props.t('The link has been copied to clipboard'), 'info')
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
        sendGlobalFlashMessage(props.t('Error while saving new available apps list'))
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
          componentTitle={<span className='componentTitle'>{state.content.label}</span>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditLabel}
          actionList={[
            {
              icon: 'fas fa-link',
              label: props.t('Copy content link'),
              onClick: this.handleClickCopyLink,
              showAction: true,
              dataCy: 'popinListItem__copyLink'
            }, {
              icon: 'far fa-trash-alt',
              label: props.t('Delete'),
              onClick: this.handleClickDelete,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id,
              disabled: state.content.is_archived || state.content.is_deleted,
              dataCy: 'popinListItem__delete'
            }
          ]}
          customActionList={buildAppCustomActionLinkList(
            state.config.appCustomActionList,
            APP_CUSTOM_ACTION_LOCATION_OBJECT.CONTENT_APP_DROPDOWN,
            state.content,
            state.loggedUser,
            CONTENT_TYPE.FOLDER,
            state.loggedUser.lang
          )}
          favoriteState={(
            props.isContentInFavoriteList(state.content, state)
              ? FAVORITE_STATE.FAVORITE
              : FAVORITE_STATE.NOT_FAVORITE
          )}
          onClickAddToFavoriteList={() => props.addContentToFavoriteList(
            state.content, state.loggedUser, this.setState.bind(this)
          )}
          onClickRemoveFromFavoriteList={() => props.removeContentFromFavoriteList(
            state.content, state.loggedUser, this.setState.bind(this)
          )}
        />

        <PopinFixedContent customClass={`${state.config.slug}__contentpage`}>
          <FolderAdvancedComponent
            editionAuthor={state.editionAuthor}
            folderSubContentType={state.content.sub_content_types || []}
            isRefreshNeeded={state.showRefreshWarning}
            onClickRefresh={this.handleClickRefresh}
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
