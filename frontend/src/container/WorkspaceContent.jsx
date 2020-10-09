import React from 'react'
import { connect } from 'react-redux'
import { Link, withRouter, Route } from 'react-router-dom'
import appFactory from '../util/appFactory.js'
import i18n from '../util/i18n.js'
import { translate } from 'react-i18next'
import {
  PAGE,
  findUserRoleIdInWorkspace,
  sortContentList,
  SHARE_FOLDER_ID,
  ANCHOR_NAMESPACE
} from '../util/helper.js'
import Folder from '../component/Workspace/Folder.jsx'
import ShareFolder from '../component/Workspace/ShareFolder.jsx'
import ContentItem from '../component/Workspace/ContentItem.jsx'
import ContentItemHeader from '../component/Workspace/ContentItemHeader.jsx'
import DropdownCreateButton from '../component/common/Input/DropdownCreateButton.jsx'
import OpenContentApp from '../component/Workspace/OpenContentApp.jsx'
import OpenShareFolderApp from '../component/Workspace/OpenShareFolderApp.jsx'
import OpenCreateContentApp from '../component/Workspace/OpenCreateContentApp.jsx'
import {
  ROLE,
  ROLE_LIST,
  PageWrapper,
  PageTitle,
  PageContent,
  BREADCRUMBS_TYPE,
  CONTENT_TYPE,
  CUSTOM_EVENT,
  buildHeadTitle,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  getFolderContentList,
  getSubFolderShareContentList,
  getShareFolderContentList,
  getContentPathList,
  getWorkspaceMemberList,
  putWorkspaceContentArchived,
  putWorkspaceContentDeleted,
  getMyselfWorkspaceReadStatusList,
  putFolderRead,
  putContentItemMove,
  getWorkspaceDetail
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceContentList,
  setWorkspaceFolderContentList,
  setWorkspaceShareFolderContentList,
  setWorkspaceMemberList,
  setWorkspaceReadStatusList,
  toggleFolderOpen,
  setWorkspaceContentRead,
  setBreadcrumbs,
  resetBreadcrumbsAppFeature,
  setWorkspaceDetail,
  setHeadTitle
} from '../action-creator.sync.js'
import uniq from 'lodash/uniq'

const qs = require('query-string')

// FIXME - CH - 2019-09-06 - hack for content type. See https://github.com/tracim/tracim/issues/2375
export const HACK_COLLABORA_CONTENT_TYPE = contentType => ({
  label: 'Collaborative document',
  slug: 'collaborative_document_edition',
  faIcon: 'file-o',
  hexcolor: '#62676a',
  creationLabel: i18n.t('Create an office document'),
  availableStatuses: contentType[0].availableStatuses
})

export class WorkspaceContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null, // this is used to avoid handling the parseInt every time
      appOpenedType: false,
      contentLoaded: false,
      shareFolder: {
        isOpen: (qs.parse(props.location.search).share_folder || '') === '1'
      }
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.REFRESH_CONTENT_LIST, handler: this.handleRefreshContentList },
      { name: CUSTOM_EVENT.OPEN_CONTENT_URL, handler: this.handleOpenContentUrl },
      { name: CUSTOM_EVENT.APP_CLOSED, handler: this.handleCloseApp },
      { name: CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT, handler: this.handleHidePopupCreateContent },
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  // CustomEvent handlers
  handleRefreshContentList = data => {
    console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', CUSTOM_EVENT.REFRESH_CONTENT_LIST, data)
    this.loadAllWorkspaceContent(this.state.workspaceIdInUrl)
  }

  handleOpenContentUrl = data => {
    const { props } = this
    console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', CUSTOM_EVENT.OPEN_CONTENT_URL, data)
    props.history.push(PAGE.WORKSPACE.CONTENT(data.workspaceId, data.contentType, data.contentId) + props.location.search)
  }

  handleCloseApp = data => {
    console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', CUSTOM_EVENT.APP_CLOSED, data, this.state.workspaceIdInUrl)
    this.updateUrlTitleBreadcrumbs()
  }

  handleHidePopupCreateContent = data => {
    console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT, data, this.state.workspaceIdInUrl)
    this.updateUrlTitleBreadcrumbs()
  }

  updateUrlTitleBreadcrumbs = () => {
    const { state, props } = this

    const contentFolderPath = props.workspaceContentList.contentList.filter(c => c.isOpen).map(c => c.id)
    const folderListInUrl = this.getFolderIdToOpenInUrl(props.location.search)

    const newUrlSearch = {
      ...qs.parse(props.location.search),
      folder_open: [...folderListInUrl, ...contentFolderPath].join(',')
    }

    props.history.push(PAGE.WORKSPACE.CONTENT_LIST(state.workspaceIdInUrl) + '?' + qs.stringify(newUrlSearch, { encode: false }))
    this.setState({ appOpenedType: false })

    this.setHeadTitle(this.getFilterName(qs.parse(props.location.search).type))
    this.props.dispatch(resetBreadcrumbsAppFeature())
  }

  handleAllAppChangeLanguage = () => {
    this.buildBreadcrumbs()
    if (!this.state.appOpenedType) this.setHeadTitle(this.getFilterName(qs.parse(this.props.location.search).type))
  }

  async componentDidMount () {
    const { props } = this

    console.log('%c<WorkspaceContent> componentDidMount', 'color: #c17838')

    this.setHeadTitle(this.getFilterName(qs.parse(props.location.search).type))

    let wsToLoad = null

    if (props.match.params.idws === undefined) {
      if (props.workspaceList.length > 0) wsToLoad = props.workspaceList[0].id
      else return
    } else wsToLoad = props.match.params.idws

    this.loadAllWorkspaceContent(wsToLoad, true)
    this.loadWorkspaceDetail()
  }

  // Côme - 2018/11/26 - refactor idea: do not rebuild folder_open when on direct link of an app (without folder_open)
  // and add process that always keep url and folders open sync
  async componentDidUpdate (prevProps, prevState) {
    const { props, state } = this

    // console.log('%c<WorkspaceContent> componentDidUpdate', 'color: #c17838', props)

    if (state.workspaceIdInUrl === null) return

    const workspaceId = parseInt(props.match.params.idws)
    if (isNaN(workspaceId)) return

    const prevFilter = qs.parse(prevProps.location.search).type
    const currentFilter = qs.parse(props.location.search).type

    const hasWorkspaceIdChanged = prevState.workspaceIdInUrl !== workspaceId

    if (prevProps.system.config.instance_name !== props.system.config.instance_name || prevProps.currentWorkspace.label !== props.currentWorkspace.label || prevFilter !== currentFilter) {
      this.setHeadTitle(this.getFilterName(currentFilter))
      this.buildBreadcrumbs()
    }

    // INFO - GM - 2020/03/03 - hide opened app if the current url is /contents
    if (PAGE.WORKSPACE.CONTENT_LIST(state.workspaceIdInUrl) === props.location.pathname && state.appOpenedType) {
      props.dispatchCustomEvent(CUSTOM_EVENT.HIDE_APP(state.appOpenedType))
      this.setState({ appOpenedType: false })
      this.setHeadTitle(this.getFilterName(qs.parse(props.location.search).type))
    }

    if (hasWorkspaceIdChanged) this.loadWorkspaceDetail()

    if (hasWorkspaceIdChanged || prevFilter !== currentFilter) {
      this.setState({ workspaceIdInUrl: workspaceId })
      this.loadAllWorkspaceContent(workspaceId, false)
    } else if (!state.appOpenedType && prevState.appOpenedType) this.buildBreadcrumbs()
  }

  componentWillUnmount () {
    this.props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP)
  }

  loadAllWorkspaceContent = async (workspaceId, shouldScrollToContent = false) => {
    try {
      await this.loadContentList(workspaceId)
      await this.loadShareFolderContent(workspaceId)
    } catch (error) {
      console.log(error.message)
      return false
    }

    this.buildBreadcrumbs()
    if (shouldScrollToContent) this.scrollToActiveContent()
    return true
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: this.props.t(msg),
      type: 'warning',
      delay: undefined
    }
  })

  setHeadTitle = (filterName) => {
    const { props } = this

    if (props.currentWorkspace.label) {
      props.dispatch(setHeadTitle(buildHeadTitle([filterName, props.currentWorkspace.label])))
    }
  }

  loadWorkspaceDetail = async () => {
    const { props } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.match.params.idws))
    switch (fetchWorkspaceDetail.status) {
      case 200:
        props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json))
        break
      case 400:
        props.history.push(PAGE.HOME)
        props.dispatch(newFlashMessage(props.t('Unknown space')))
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('space detail')}`, 'warning')); break
    }
  }

  buildBreadcrumbs = () => {
    const { props, state } = this
    const breadcrumbsList = [{
      link: <Link to={PAGE.HOME}><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: (
        <Link to={PAGE.WORKSPACE.DASHBOARD(state.workspaceIdInUrl)}>
          {props.t(props.workspaceList.find(ws => ws.id === state.workspaceIdInUrl).label)}
        </Link>
      ),
      type: BREADCRUMBS_TYPE.CORE
    }]

    const urlFilter = qs.parse(props.location.search).type

    if (urlFilter) {
      breadcrumbsList.push({
        link: (
          <Link to={`${PAGE.WORKSPACE.CONTENT_LIST(state.workspaceIdInUrl)}?type=${urlFilter}`}>
            {props.t((props.contentType.find(ct => ct.slug === urlFilter) || { label: '' }).label + 's')}
          </Link>
        ),
        type: BREADCRUMBS_TYPE.CORE
      })
    } else {
      breadcrumbsList.push({
        link: (
          <Link to={`${PAGE.WORKSPACE.CONTENT_LIST(state.workspaceIdInUrl)}`}>
            {props.t('All contents')}
          </Link>
        ),
        type: BREADCRUMBS_TYPE.CORE
      })
    }

    // INFO - GM - 2020/03/03 - add file breadcrumbs link if it exists
    if (props.breadcrumbs.length === breadcrumbsList.length + 1 && state.appOpenedType) breadcrumbsList.push(props.breadcrumbs[props.breadcrumbs.length - 1])

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  loadContentList = async (workspaceId) => {
    console.log('%c<WorkspaceContent> loadContentList', 'color: #c17838')
    const { props } = this

    const folderIdInUrl = [0, ...this.getFolderIdToOpenInUrl(props.location.search)] // add 0 to get workspace's root

    const contentIdInUrl = (props.match && props.match.params.idcts) || null

    if (contentIdInUrl && contentIdInUrl !== 'new' && props.match && props.match.params.type === CONTENT_TYPE.FOLDER) folderIdInUrl.push(contentIdInUrl)

    const fetchContentList = await props.dispatch(
      (contentIdInUrl && !isNaN(contentIdInUrl))
        ? getContentPathList(workspaceId, contentIdInUrl, folderIdInUrl)
        : getFolderContentList(
          workspaceId,
          folderIdInUrl.filter(id => id !== SHARE_FOLDER_ID)
        )
    )

    const wsMember = await props.dispatch(getWorkspaceMemberList(workspaceId))
    const wsReadStatus = await props.dispatch(getMyselfWorkspaceReadStatusList(workspaceId))

    switch (fetchContentList.status) {
      case 200: {
        const folderToOpen = [
          ...folderIdInUrl,
          ...fetchContentList.json.filter(c => c.parent_id !== null).map(c => c.parent_id)
        ]
        props.dispatch(setWorkspaceContentList(fetchContentList.json, folderToOpen, parseInt(workspaceId)))
        break
      }
      case 400:
        switch (fetchContentList.json.code) {
          // INFO - B.L - 2019.08.06 - content id does not exists in db
          case 1003:
          // INFO - B.L - 2019.08.06 - content id is not a valid integer
          case 2023: // eslint-disable-line no-fallthrough
            props.dispatch(newFlashMessage(props.t('Content not found'), 'warning'))
            props.history.push(`/ui/workspaces/${workspaceId}/contents`)
            this.loadAllWorkspaceContent(workspaceId, false) // INFO - CH - 2019-08-27 - force reload data because, in this case, componentDidUpdate wont
            throw new Error(fetchContentList.json.message)
          // INFO - B.L - 2019.08.06 - workspace does not exists or forbidden
          case 1002:
          // INFO - B.L - 2019.08.06 - workspace id is not a valid integer
          case 2022: // eslint-disable-line no-fallthrough
            props.dispatch(newFlashMessage(props.t('Space not found'), 'warning'))
            props.history.push('/ui')
            throw new Error(fetchContentList.json.message)
        }
        break
      case 401: break
      default: {
        props.history.push('/ui')
        throw new Error('Error while loading content list')
      }
    }

    switch (wsMember.status) {
      case 200: props.dispatch(setWorkspaceMemberList(wsMember.json)); break
      case 401: break
      default: props.dispatch(newFlashMessage(props.t('Error while loading members list'), 'warning'))
    }

    switch (wsReadStatus.status) {
      case 200: props.dispatch(setWorkspaceReadStatusList(wsReadStatus.json)); break
      case 401: break
      default: props.dispatch(newFlashMessage(props.t('Error while loading read status list'), 'warning'))
    }

    this.setState({ contentLoaded: true })
  }

  handleClickContentItem = content => {
    console.log('%c<WorkspaceContent> content clicked', 'color: #c17838', content)
    this.props.history.push(`${PAGE.WORKSPACE.CONTENT(content.workspaceId, content.type, content.id)}${this.props.location.search}`)
  }

  handleClickEditContentItem = (e, content) => {
    e.preventDefault()
    e.stopPropagation()
    this.handleClickContentItem(content)
  }

  handleClickDownloadContentItem = (e, content) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('%c<WorkspaceContent> download nyi', 'color: #c17838', content)
  }

  handleClickArchiveContentItem = async (e, content) => {
    const { props, state } = this

    e.preventDefault()
    e.stopPropagation()

    const fetchPutContentArchived = await props.dispatch(putWorkspaceContentArchived(content.workspaceId, content.id))
    switch (fetchPutContentArchived.status) {
      case 204:
        this.loadContentList(state.workspaceIdInUrl)
        break
      default: props.dispatch(newFlashMessage(props.t('Error while archiving content'), 'warning'))
    }
  }

  handleClickArchiveShareFolderContentItem = async (e, content) => {
    const { props, state } = this

    e.preventDefault()
    e.stopPropagation()

    const fetchPutContentArchived = await props.dispatch(putWorkspaceContentArchived(content.workspaceId, content.id))
    switch (fetchPutContentArchived.status) {
      case 204:
        this.loadShareFolderContent(state.workspaceIdInUrl)
        break
      default: props.dispatch(newFlashMessage(props.t('Error while archiving content'), 'warning'))
    }
  }

  handleClickDeleteContentItem = async (e, content) => {
    const { props } = this

    e.preventDefault()
    e.stopPropagation()
    const fetchPutContentDeleted = await props.dispatch(putWorkspaceContentDeleted(content.workspaceId, content.id))

    if (fetchPutContentDeleted.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while deleting content'), 'warning'))
    }
  }

  handleClickDeleteShareFolderContentItem = async (e, content) => {
    const { props } = this

    e.preventDefault()
    e.stopPropagation()
    const fetchPutContentDeleted = await props.dispatch(putWorkspaceContentDeleted(content.workspaceId, content.id))

    if (fetchPutContentDeleted.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while deleting content'), 'warning'))
    }
  }

  handleClickFolder = async (e, folderId) => {
    const { props } = this

    const folderListInUrl = this.getFolderIdToOpenInUrl(props.location.search)
    const newUrlSearchList = folderListInUrl.some(id => id === folderId)
      ? folderListInUrl.filter(id => id !== folderId)
      : uniq([...folderListInUrl, folderId])

    const newUrlSearchObject = {
      ...qs.parse(props.location.search),
      folder_open: newUrlSearchList.join(',')
    }

    if (e && e.ctrlKey) {
      const url = props.location.pathname + '?' + qs.stringify(newUrlSearchObject, { encode: false })
      window.open(url, '_blank')
      return
    }
    props.history.push(props.location.pathname + '?' + qs.stringify(newUrlSearchObject, { encode: false }))

    this.handleToggleFolderOpen(folderId)
  }

  handleClickCreateContent = (e, folderId, contentType) => {
    const { props, state } = this

    const folderOpen = folderId
      ? (props.workspaceContentList.contentList.find(c => c.id === folderId) || { isOpen: false }).isOpen
      : false

    const urlSearch = qs.parse(props.location.search)
    delete urlSearch.parent_id

    const folderListInUrl = this.getFolderIdToOpenInUrl(props.location.search)
    const newFolderOpenList = folderOpen
      ? folderListInUrl
      : uniq([...folderListInUrl, folderId])

    const newUrlSearch = {
      ...urlSearch,
      folder_open: newFolderOpenList.join(',')
    }

    if (folderId && !folderOpen) this.handleToggleFolderOpen(folderId)

    props.history.push(
      `${PAGE.WORKSPACE.NEW(state.workspaceIdInUrl, contentType)}?${qs.stringify(newUrlSearch, { encode: false })}&parent_id=${folderId}`
    )
  }

  handleToggleFolderOpen = async folderId => {
    const { props, state } = this
    const folder = props.workspaceContentList.contentList.find(content => content.id === folderId) || props.workspaceShareFolderContentList.contentList.find(c => c.id === folderId)

    const isFolderPreviousStateOpen = folder.isOpen

    props.dispatch(toggleFolderOpen(folderId, state.workspaceIdInUrl))

    if (isFolderPreviousStateOpen) return

    const fetchContentList = folder.parentId === SHARE_FOLDER_ID
      ? await props.dispatch(getSubFolderShareContentList(state.workspaceIdInUrl, [folderId]))
      : await props.dispatch(getFolderContentList(state.workspaceIdInUrl, [folderId]))

    if (fetchContentList.status === 200) {
      props.dispatch(setWorkspaceFolderContentList(state.workspaceIdInUrl, folder.id, fetchContentList.json))
    }
  }

  getContentParentList = (content, contentList) => {
    const parent = contentList.find(c => c.id === content.parentId)
    if (!parent) return []

    return [parent.id, ...this.getContentParentList(parent, contentList)]
  }

  handleDropMoveContent = async (source, destination) => {
    const { props } = this

    if (source.contentId === destination.contentId) return

    if (destination.id === SHARE_FOLDER_ID || destination.parentId === SHARE_FOLDER_ID) return

    // INFO - CH - 2019-06-14 - Check that not moving a folder into one of its sub folder
    if (source.workspaceId === destination.workspaceId && destination.parentId !== 0) {
      const destinationContent = props.workspaceContentList.contentList.find(c => c.id === destination.contentId)
      const parentIdList = this.getContentParentList(destinationContent, props.workspaceContentList.contentList)

      if (parentIdList.includes(source.contentId)) return
    }

    // INFO - CH - 2019-06-14 - Check user is allowed to drop in the different destination workspace
    if (source.workspaceId !== destination.workspaceId) {
      const destinationMemberList = props.workspaceList.find(ws => ws.id === destination.workspaceId).memberList
      const userRoleIdInDestination = findUserRoleIdInWorkspace(props.user.userId, destinationMemberList, ROLE_LIST)

      if (userRoleIdInDestination < ROLE.contentManager.id) {
        props.dispatch(newFlashMessage(props.t('Insufficient rights'), 'danger'))
        return
      }
    }

    const fetchMoveContent = await props.dispatch(putContentItemMove(source, destination))
    if (fetchMoveContent.status !== 200) {
      switch (fetchMoveContent.json.code) {
        case 3002:
          props.dispatch(newFlashMessage(props.t('A content with same name already exists'), 'danger'))
          break
        case 2038:
          props.dispatch(newFlashMessage(props.t("The destination folder doesn't allow this content type"), 'danger'))
          break
        default:
          props.dispatch(newFlashMessage(props.t('Error while moving content'), 'danger'))
          break
      }
    }
  }

  handleUpdateAppOpenedType = openedAppType => this.setState({ appOpenedType: openedAppType })

  handleSetFolderRead = async folderId => {
    const { props, state } = this
    const fetchSetFolderRead = await props.dispatch(putFolderRead(props.user.userId, state.workspaceIdInUrl, folderId))
    switch (fetchSetFolderRead.status) {
      case 204: props.dispatch(setWorkspaceContentRead(folderId)); break
      default: console.log(`Error while setting folder ${folderId} read status. fetchSetFolderRead: `, fetchSetFolderRead)
    }
  }

  getFolderIdToOpenInUrl = urlSearch => (qs.parse(urlSearch).folder_open || '').split(',').filter(str => str !== '').map(str => parseInt(str))

  getContentIdOpenedInUrl = params => {
    if (params === undefined) return undefined
    if (Object.keys(CONTENT_TYPE).find(key => CONTENT_TYPE[key] === params.type)) {
      return params.idcts
    }
    return undefined
  }

  getTitle = urlFilter => {
    const { props } = this
    const contentType = props.contentType.find(ct => ct.slug === urlFilter)
    return contentType
      ? `${props.t('List of')} ${props.t(contentType.label.toLowerCase() + 's')}`
      : props.t('List of contents')
  }

  getFilterName = urlFilter => {
    const { props } = this
    const contentType = props.contentType.find(ct => ct.slug === urlFilter)
    const filterName = contentType
      ? props.t(contentType.label.toLowerCase() + 's')
      : props.t('Contents')
    return filterName[0].toUpperCase() + filterName.toLowerCase().substr(1)
  }

  getIcon = urlFilter => {
    const contentType = this.props.contentType.find(ct => ct.slug === urlFilter)
    return contentType
      ? contentType.faIcon
      : 'th'
  }

  loadShareFolderContent = async workspaceId => {
    const { props } = this

    const folderIdToOpen = this.getFolderIdToOpenInUrl(props.location.search)
    const response = await props.dispatch(getShareFolderContentList(workspaceId))

    switch (response.status) {
      case 200: {
        const publicSharedContentList = response.json.map(file => file.parent_id === null
          ? { ...file, parent_id: SHARE_FOLDER_ID }
          : file
        )
        props.dispatch(setWorkspaceShareFolderContentList(publicSharedContentList, folderIdToOpen, parseInt(workspaceId)))
        return true
      }
      default:
        this.sendGlobalFlashMessage(props.t('Error while loading uploaded files'))
        return false
    }
  }

  handleClickShareFolder = async () => {
    const { props, state } = this

    const newUrlSearchObject = {
      ...qs.parse(props.location.search),
      share_folder: state.shareFolder.isOpen ? 0 : 1 // INFO - CH - 2019/08/27 - switch to the opposite
    }

    this.setState(previousState => ({
      shareFolder: {
        isOpen: !previousState.shareFolder.isOpen
      }
    }))

    props.history.push(props.location.pathname + '?' + qs.stringify(newUrlSearchObject, { encode: false }))
  }

  filterWorkspaceContent = (contentList, filter) => filter.length === 0
    ? contentList
    : contentList.filter(c => c.type === CONTENT_TYPE.FOLDER || filter.includes(c.type)) // keep unfiltered files and folders

  displayWorkspaceEmptyMessage = (userRoleIdInWorkspace, isWorkspaceEmpty, isFilteredWorkspaceEmpty) => {
    const { props } = this

    const creationAllowedMessage = !isWorkspaceEmpty && isFilteredWorkspaceEmpty
      ? props.t('This space has no content of that type yet') + props.t(", create the first content of that type by clicking on the button 'Create'")
      : props.t('This space has no content yet') + props.t(", create the first content by clicking on the button 'Create'")

    const creationNotAllowedMessage = !isWorkspaceEmpty && isFilteredWorkspaceEmpty
      ? props.t('This space has no content of that type yet')
      : props.t('This space has no content yet')

    return (
      <div className='workspace__content__fileandfolder__empty'>
        {userRoleIdInWorkspace > ROLE.reader.id ? creationAllowedMessage : creationNotAllowedMessage}
      </div>
    )
  }

  scrollToActiveContent = () => {
    let contentToScrollTo = this.getContentIdOpenedInUrl(this.props.match.params)

    if (contentToScrollTo === undefined) {
      const folderIdToOpen = this.getFolderIdToOpenInUrl(this.props.location.search)
      if (folderIdToOpen.length > 0) contentToScrollTo = folderIdToOpen[folderIdToOpen.length - 1]
    }
    const idContentToScrollTo = `${ANCHOR_NAMESPACE.workspaceItem}:${contentToScrollTo}`
    if (document.getElementById(idContentToScrollTo)) document.getElementById(idContentToScrollTo).scrollIntoView()
  }

  render () {
    const { breadcrumbs, user, currentWorkspace, workspaceShareFolderContentList, contentType, location, t, appList } = this.props
    const { state, props } = this

    const workspaceContentList = props.workspaceContentList && props.workspaceContentList.contentList
      ? props.workspaceContentList.contentList
      : []

    const urlFilter = qs.parse(location.search).type

    const filteredWorkspaceContentList = workspaceContentList.length > 0
      ? this.filterWorkspaceContent(workspaceContentList, urlFilter ? [urlFilter] : [])
      : []

    const rootContentList = sortContentList(
      filteredWorkspaceContentList.filter(c => c.parentId === null),
      props.user.lang
    )

    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(user.userId, currentWorkspace.memberList, ROLE_LIST)

    const createContentAvailableApp = [
      ...contentType
        .filter(ct => ct.slug !== CONTENT_TYPE.COMMENT)
        .filter(ct => userRoleIdInWorkspace === ROLE.contributor.id ? ct.slug !== CONTENT_TYPE.FOLDER : true),

      // FIXME - CH - 2019-09-06 - hack for content type. See https://github.com/tracim/tracim/issues/2375
      ...(appList.find(app => app.slug === HACK_COLLABORA_CONTENT_TYPE(contentType).slug)
        ? [HACK_COLLABORA_CONTENT_TYPE(contentType)]
        : []
      )
    ]

    const isWorkspaceEmpty = workspaceContentList.length === 0
    const isFilteredWorkspaceEmpty = rootContentList.length === 0

    return (
      <div className='tracim__content-scrollview fullWidthFullHeight'>
        <div className='WorkspaceContent'>
          {state.contentLoaded && (
            <OpenContentApp
              // automatically open the app for the contentId in url
              workspaceId={state.workspaceIdInUrl}
              appOpenedType={state.appOpenedType}
              onUpdateAppOpenedType={this.handleUpdateAppOpenedType}
            />
          )}

          {state.contentLoaded && (
            <Route
              path={PAGE.WORKSPACE.SHARE_FOLDER(':idws')}
              component={() => (
                <OpenShareFolderApp
                  // automatically open the share folder advanced
                  workspaceId={state.workspaceIdInUrl}
                  appOpenedType={state.appOpenedType}
                  onUpdateAppOpenedType={this.handleUpdateAppOpenedType}
                />
              )}
            />
          )}

          {state.contentLoaded && (
            <Route
              path={PAGE.WORKSPACE.NEW(':idws', ':type')}
              component={() => (
                <OpenCreateContentApp
                  // automatically open the popup create content of the app in url
                  workspaceId={state.workspaceIdInUrl}
                  appOpenedType={state.appOpenedType}
                />
              )}
            />
          )}

          <PageWrapper customClass='workspace'>
            <PageTitle
              parentClass='workspace__header'
              customClass='justify-content-between align-items-center'
              title={this.getTitle(urlFilter)}
              icon={this.getIcon(urlFilter)}
              breadcrumbsList={breadcrumbs}
            >
              {userRoleIdInWorkspace >= ROLE.contributor.id && (
                <DropdownCreateButton
                  folderId={null} // null because it is workspace root content
                  onClickCreateContent={this.handleClickCreateContent}
                  availableApp={createContentAvailableApp}
                />
              )}
            </PageTitle>

            <PageContent parentClass='workspace__content'>
              <div className='workspace__content__fileandfolder folder__content active'>
                <ContentItemHeader />

                {currentWorkspace.uploadEnabled && appList.some(a => a.slug === 'upload_permission') && (
                  <ShareFolder
                    workspaceId={state.workspaceIdInUrl}
                    availableApp={createContentAvailableApp}
                    isOpen={state.shareFolder.isOpen}
                    lang={props.user.lang}
                    getContentParentList={this.getContentParentList}
                    onDropMoveContentItem={this.handleDropMoveContent}
                    onClickFolder={this.handleClickFolder}
                    onClickCreateContent={this.handleClickCreateContent}
                    onSetFolderRead={this.handleSetFolderRead}
                    userRoleIdInWorkspace={userRoleIdInWorkspace}
                    shareFolderContentList={workspaceShareFolderContentList.contentList}
                    onClickExtendedAction={{
                      edit: this.handleClickEditContentItem,
                      download: this.handleClickDownloadContentItem,
                      archive: this.handleClickArchiveShareFolderContentItem,
                      delete: this.handleClickDeleteShareFolderContentItem
                    }}
                    onClickShareFolder={this.handleClickShareFolder}
                    contentType={contentType}
                    readStatusList={currentWorkspace.contentReadStatusList}
                    rootContentList={rootContentList}
                    isLast={isWorkspaceEmpty || isFilteredWorkspaceEmpty}
                    t={t}
                  />
                )}

                {((state.contentLoaded && (isWorkspaceEmpty || isFilteredWorkspaceEmpty))
                  ? this.displayWorkspaceEmptyMessage(userRoleIdInWorkspace, isWorkspaceEmpty, isFilteredWorkspaceEmpty)
                  : rootContentList.map((content, i) => content.type === CONTENT_TYPE.FOLDER
                    ? (
                      <Folder
                        availableApp={createContentAvailableApp}
                        folderData={content}
                        lang={props.user.lang}
                        workspaceContentList={filteredWorkspaceContentList}
                        getContentParentList={this.getContentParentList}
                        userRoleIdInWorkspace={userRoleIdInWorkspace}
                        onClickExtendedAction={{
                          edit: this.handleClickEditContentItem,
                          download: this.handleClickDownloadContentItem,
                          archive: this.handleClickArchiveContentItem,
                          delete: this.handleClickDeleteContentItem
                        }}
                        onDropMoveContentItem={this.handleDropMoveContent}
                        onClickFolder={this.handleClickFolder}
                        onClickCreateContent={this.handleClickCreateContent}
                        contentType={contentType}
                        readStatusList={currentWorkspace.contentReadStatusList}
                        onSetFolderRead={this.handleSetFolderRead}
                        isLast={i === rootContentList.length - 1}
                        key={content.id}
                        t={t}
                      />
                    )
                    : (
                      <ContentItem
                        contentId={content.id}
                        workspaceId={content.workspaceId}
                        parentId={content.parentId}
                        label={content.label}
                        fileName={content.fileName}
                        fileExtension={content.fileExtension}
                        faIcon={contentType.length ? contentType.find(a => a.slug === content.type).faIcon : ''}
                        isShared={content.activedShares !== 0 && currentWorkspace.downloadEnabled}
                        statusSlug={content.statusSlug}
                        contentType={contentType.length ? contentType.find(ct => ct.slug === content.type) : null}
                        isLast={i === rootContentList.length - 1}
                        urlContent={`${PAGE.WORKSPACE.CONTENT(content.workspaceId, content.type, content.id)}${location.search}`}
                        userRoleIdInWorkspace={userRoleIdInWorkspace}
                        read={currentWorkspace.contentReadStatusList.includes(content.id)}
                        onClickExtendedAction={{
                          edit: {
                            callback: e => this.handleClickEditContentItem(e, content),
                            label: props.t('Edit')
                          },
                          download: {
                            callback: e => this.handleClickDownloadContentItem(e, content),
                            label: props.t('Download')
                          },
                          archive: {
                            callback: e => this.handleClickArchiveContentItem(e, content),
                            label: props.t('Archive')
                          },
                          delete: {
                            callback: e => this.handleClickDeleteContentItem(e, content),
                            label: props.t('Delete')
                          }
                        }}
                        onDropMoveContentItem={this.handleDropMoveContent}
                        key={content.id}
                      />
                    )
                  )
                )}

                {userRoleIdInWorkspace >= ROLE.contributor.id && workspaceContentList.length >= 10 && (
                  <DropdownCreateButton
                    folderId={null}
                    onClickCreateContent={this.handleClickCreateContent}
                    availableApp={createContentAvailableApp}
                  />
                )}
              </div>
            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, currentWorkspace, workspaceContentList, workspaceShareFolderContentList, workspaceList, contentType, appList }) => ({
  breadcrumbs, user, currentWorkspace, workspaceContentList, workspaceShareFolderContentList, workspaceList, contentType, appList
})
export default withRouter(connect(mapStateToProps)(appFactory(translate()(TracimComponent(WorkspaceContent)))))
