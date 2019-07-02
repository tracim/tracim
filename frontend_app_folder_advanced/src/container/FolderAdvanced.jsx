import React from 'react'
import FolderAdvancedComponent from '../component/FolderAdvanced.jsx'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  handleFetchResult,
  addAllResourceI18n,
  // SelectStatus,
  ArchiveDeleteContent,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import { debug } from '../helper.js'
import {
  getFolder,
  getContentTypeList,
  putFolder,
  // putFolderStatus,
  putFolderIsArchived,
  putFolderIsDeleted,
  putFolderRestoreArchived,
  putFolderRestoreDeleted
} from '../action.async.js'

class FolderAdvanced extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'folder',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      externalTranslationList: [
        props.t('Create a folder'),
        props.t('Folder')
      ],
      tracimContentTypeList: []
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case CUSTOM_EVENT.SHOW_APP('folder'):
        console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({content: {...prev.content, ...data.content}, isVisible: true}))
        break
      case CUSTOM_EVENT.HIDE_APP('folder'):
        console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState({isVisible: false})
        break
      case CUSTOM_EVENT.RELOAD_CONTENT('folder'):
        console.log('%c<FolderAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({content: {...prev.content, ...data}, isVisible: true}))
        break
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANG:
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        this.loadContent()
        break
    }
  }

  componentDidMount () {
    this.loadContent()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    if (prevState.content.content_id !== state.content.content_id) {
      this.loadContent()
    }
  }

  componentWillUnmount () {
    console.log('%c<FolderAdvanced> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT, this.customEventReducer)
  }

  sendGlobalFlashMessage = (msg, type = 'info') => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: type,
      delay: undefined
    }
  })

  loadContent = async () => {
    const { props, state } = this

    const fetchFolder = await handleFetchResult(await getFolder(state.config.apiUrl, state.content.workspace_id, state.content.content_id))
    const fetchContentTypeList = await handleFetchResult(await getContentTypeList(state.config.apiUrl))

    switch (fetchFolder.apiResponse.status) {
      case 200: this.setState({content: fetchFolder.body}); break
      default: this.sendGlobalFlashMessage(props.t('Error while loading folder details'), 'warning')
    }

    switch (fetchContentTypeList.apiResponse.status) {
      case 200: this.setState({tracimContentTypeList: fetchContentTypeList.body.filter(ct => ct.slug !== 'comment')}); break
      default: this.sendGlobalFlashMessage(props.t("Error while loading tracim's content type list"), 'warning')
    }
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({type: CUSTOM_EVENT.APP_CLOSED, data: {}}) // handled by tracim_front::src/container/WorkspaceContent.jsx
  }

  handleSaveEditLabel = async newLabel => {
    const { props, state } = this
    const fetchPutWorkspaceLabel = await handleFetchResult(
      await putFolder(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newLabel, '', state.content.sub_content_types)
    )
    switch (fetchPutWorkspaceLabel.apiResponse.status) {
      case 200:
        this.setState(prev => ({content: {...prev.content, label: newLabel}}))
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new folder label'), 'warning')
    }
  }

  handleClickCheckbox = async appSlug => {
    const { props, state } = this

    const oldAvailableAppList = state.content.sub_content_types

    const newAvailableAppList = state.content.sub_content_types.find(c => c === appSlug)
      ? state.content.sub_content_types.filter(c => c !== appSlug)
      : [...state.content.sub_content_types, appSlug]

    this.setState(prev => ({content: {...prev.content, sub_content_types: newAvailableAppList}}))

    const fetchPutWorkspaceLabel = await handleFetchResult(
      await putFolder(state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.label, '', newAvailableAppList)
    )

    switch (fetchPutWorkspaceLabel.apiResponse.status) {
      case 200:
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while saving new available apps list'), 'warning')
        this.setState(prev => ({content: {...prev.content, sub_content_types: oldAvailableAppList}}))
        break
    }
  }

  // Côme - 2018/11/23 - status not used for folders yet
  // handleChangeStatus = async newStatus => {
  //   const { state } = this
  //
  //   const fetchResultSaveEditStatus = putFolderStatus(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newStatus)
  //
  //   const fetchResultStatus = await handleFetchResult(await fetchResultSaveEditStatus)
  //   switch (fetchResultStatus.status) { // 204 no content so dont take status from resSave.apiResponse.status
  //     case 204: this.loadContent(); break
  //     default: this.sendGlobalFlashMessage(this.props.t("Error saving folder's status, result:"), 'warning')
  //   }
  // }

  handleClickArchive = async () => {
    const { config, content } = this.state

    const fetchResultArchive = await putFolderIsArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_archived: true}}))
        this.loadContent()
        break
      default: this.sendGlobalFlashMessage(this.props.t('Error while archiving folder'), 'warning')
    }
  }

  handleClickDelete = async () => {
    const { config, content } = this.state

    const fetchResultArchive = await putFolderIsDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_deleted: true}}))
        this.loadContent()
        break
      default: this.sendGlobalFlashMessage(this.props.t('Error while deleting folder'), 'warning')
    }
  }

  handleClickRestoreArchived = async () => {
    const { config, content } = this.state

    const fetchResultRestore = await putFolderRestoreArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_archived: false}}))
        this.loadContent()
        break
      default: this.sendGlobalFlashMessage(this.props.t('Error while restoring folder'), 'warning')
    }
  }

  handleClickRestoreDeleted = async () => {
    const { config, content } = this.state

    const fetchResultRestore = await putFolderRestoreDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_deleted: false}}))
        this.loadContent()
        break
      default: this.sendGlobalFlashMessage(this.props.t('Error while restoring folder'), 'warning')
    }
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
          idRoleUserWorkspace={state.loggedUser.idRoleUserWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditLabel}
        />

        <PopinFixedOption>
          <div className='justify-content-end'>
            <div className='d-flex'>
              {/* state.loggedUser.idRoleUserWorkspace >= 2 &&
                <SelectStatus
                  selectedStatus={state.config.availableStatuses.find(s => s.slug === state.content.status)}
                  availableStatus={state.config.availableStatuses}
                  onChangeStatus={this.handleChangeStatus}
                  disabled={state.content.is_archived || state.content.is_deleted}
                />
              */}

              {state.loggedUser.idRoleUserWorkspace >= 4 &&
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
            onClickRestoreArchived={this.handleClickRestoreArchived}
            onClickRestoreDeleted={this.handleClickRestoreDeleted}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(FolderAdvanced)
