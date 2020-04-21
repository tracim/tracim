import React from 'react'
import FolderAdvancedComponent from '../component/FolderAdvanced.jsx'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
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
  BREADCRUMBS_TYPE
} from 'tracim_frontend_lib'
import { debug } from '../debug.js'
import {
  getFolder,
  getContentTypeList,
  putFolder
} from '../action.async.js'

class FolderAdvanced extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'folder',
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

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)

    this.loadContent().then(() => {
      this.buildBreadcrumbs()
    })
  }

  customEventReducer = ({ detail: { type, data } }) => {
    const { props, state } = this
    switch (type) {
      case CUSTOM_EVENT.SHOW_APP(state.config.slug):
        console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
        if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
        break

      case CUSTOM_EVENT.HIDE_APP(state.config.slug):
        console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
        break

      case CUSTOM_EVENT.RELOAD_CONTENT(state.config.slug):
        console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({ content: { ...prev.content, ...data }, isVisible: true }))
        break

      case CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(state.config.slug):
        console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerReloadAppFeatureData(this.loadContent, this.loadTimeline, this.buildBreadcrumbs)
        break

      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
        this.loadContent()
        break
    }
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    if (prevState.content.content_id !== state.content.content_id) {
      await this.loadContent()
      this.buildBreadcrumbs()
    }
  }

  componentWillUnmount () {
    console.log('%c<FolderAdvanced> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
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

    if (state.config && state.config.system && state.config.system.config && state.config.workspace && state.isVisible) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([folderName, state.config.workspace.label, state.config.system.config.instance_name]) }
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
        break
      default: this.sendGlobalFlashMessage(props.t('Error while loading folder details'), 'warning')
    }

    switch (fetchContentTypeList.apiResponse.status) {
      case 200: this.setState({ tracimContentTypeList: fetchContentTypeList.body.filter(ct => ct.slug !== 'comment') }); break
      default: this.sendGlobalFlashMessage(props.t("Error while loading Tracim's content type list"), 'warning')
    }
  }

  loadTimeline = () => {}

  buildBreadcrumbs = () => {
    const { state } = this

    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.APPEND_BREADCRUMBS,
      data: {
        breadcrumbs: [{
          url: `/ui/workspaces/${state.content.workspace_id}/contents/${state.config.slug}/${state.content.content_id}`,
          label: state.content.label,
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

  render () {
    const { state } = this

    if (!state.isVisible) return null

    return (
      <PopinFixed customClass='folder_advanced'>
        <PopinFixedHeader
          customClass={'folderAdvanced'}
          customColor={state.config.hexcolor}
          faIcon={state.config.faIcon}
          rawTitle={state.content.label}
          componentTitle={<div>{state.content.label}</div>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditLabel}
        />

        <PopinFixedOption>
          <div className='justify-content-end'>
            <div className='d-flex'>
              {/* state.loggedUser.userRoleIdInWorkspace >= 2 &&
                <SelectStatus
                  selectedStatus={state.config.availableStatuses.find(s => s.slug === state.content.status)}
                  availableStatus={state.config.availableStatuses}
                  onChangeStatus={this.handleChangeStatus}
                  disabled={state.content.is_archived || state.content.is_deleted}
                />
              */}

              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id &&
                <ArchiveDeleteContent
                  customColor={state.config.hexcolor}
                  onClickArchiveBtn={this.handleClickArchive}
                  onClickDeleteBtn={this.handleClickDelete}
                  disabled={state.content.is_archived || state.content.is_deleted}
                />
              }
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

export default translate()(appContentFactory(FolderAdvanced))
