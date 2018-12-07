import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Route } from 'react-router-dom'
import appFactory from '../appFactory.js'
import { translate } from 'react-i18next'
import {
  PAGE,
  ROLE,
  findIdRoleUserWorkspace
} from '../helper.js'
import Folder from '../component/Workspace/Folder.jsx'
import ContentItem from '../component/Workspace/ContentItem.jsx'
import ContentItemHeader from '../component/Workspace/ContentItemHeader.jsx'
import DropdownCreateButton from '../component/common/Input/DropdownCreateButton.jsx'
import OpenContentApp from '../component/Workspace/OpenContentApp.jsx'
import OpenCreateContentApp from '../component/Workspace/OpenCreateContentApp.jsx'
import {
  PageWrapper,
  PageTitle,
  PageContent
} from 'tracim_frontend_lib'
import {
  getFolderContentList,
  getContentPathList,
  getWorkspaceMemberList,
  putWorkspaceContentArchived,
  putWorkspaceContentDeleted,
  getMyselfWorkspaceReadStatusList,
  putFolderRead
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceContentList,
  addWorkspaceContentList,
  setWorkspaceContentArchived,
  setWorkspaceContentDeleted,
  setWorkspaceMemberList,
  setWorkspaceReadStatusList,
  toggleFolderOpen,
  setWorkspaceContentRead
} from '../action-creator.sync.js'
import uniq from 'lodash/uniq'

const qs = require('query-string')

class WorkspaceContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      idWorkspaceInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null, // this is used to avoid handling the parseInt every time
      appOpenedType: false,
      contentLoaded: false
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    const { props, state } = this
    switch (type) {
      case 'refreshContentList':
        console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', type, data)
        this.loadContentList(state.idWorkspaceInUrl)
        break

      case 'openContentUrl':
        console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', type, data)
        props.history.push(PAGE.WORKSPACE.CONTENT(data.idWorkspace, data.contentType, data.idContent) + props.location.search)
        break

      case 'appClosed':
      case 'hide_popupCreateContent':
        console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', type, data, state.idWorkspaceInUrl)

        const contentFolderPath = props.workspaceContentList.filter(c => c.isOpen).map(c => c.id)
        const folderListInUrl = this.getIdFolderToOpenInUrl(props.location.search)

        const newUrlSearch = {
          ...qs.parse(props.location.search),
          folder_open: [...folderListInUrl, ...contentFolderPath].join(',')
        }

        props.history.push(PAGE.WORKSPACE.CONTENT_LIST(state.idWorkspaceInUrl) + '?' + qs.stringify(newUrlSearch, {encode: false}))
        this.setState({appOpenedType: false})
        break
    }
  }

  componentDidMount () {
    const { workspaceList, match } = this.props

    console.log('%c<WorkspaceContent> componentDidMount', 'color: #c17838')

    let wsToLoad = null

    if (match.params.idws === undefined) {
      if (workspaceList.length > 0) wsToLoad = workspaceList[0].id
      else return
    } else wsToLoad = match.params.idws

    this.loadContentList(wsToLoad)
  }

  // Côme - 2018/11/26 - refactor idea: do not rebuild folder_open when on direct link of an app (without folder_open)
  // and add process that always keep url and folders open sync
  async componentDidUpdate (prevProps, prevState) {
    console.log('%c<WorkspaceContent> componentDidUpdate', 'color: #c17838')

    if (this.state.idWorkspaceInUrl === null) return

    const idWorkspace = parseInt(this.props.match.params.idws)
    if (isNaN(idWorkspace)) return

    const prevFilter = qs.parse(prevProps.location.search).type
    const currentFilter = qs.parse(this.props.location.search).type

    if (prevState.idWorkspaceInUrl !== idWorkspace || prevFilter !== currentFilter) {
      this.setState({idWorkspaceInUrl: idWorkspace})
      this.loadContentList(idWorkspace)
    }
  }

  componentWillUnmount () {
    this.props.dispatchCustomEvent('unmount_app')
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadContentList = async idWorkspace => {
    console.log('%c<WorkspaceContent> loadContentList', 'color: #c17838')
    const { props } = this

    const idFolderInUrl = [0, ...this.getIdFolderToOpenInUrl(props.location.search)] // add 0 to get workspace's root

    const idContentInUrl = (props.match && props.match.params.idcts) || null

    if (idContentInUrl && idContentInUrl !== 'new' && props.match && props.match.params.type === 'folder') idFolderInUrl.push(idContentInUrl)

    let fetchContentList
    if (idContentInUrl && !isNaN(idContentInUrl)) fetchContentList = await props.dispatch(getContentPathList(idWorkspace, idContentInUrl, idFolderInUrl))
    else fetchContentList = await props.dispatch(getFolderContentList(idWorkspace, idFolderInUrl))

    const wsMember = await props.dispatch(getWorkspaceMemberList(idWorkspace))
    const wsReadStatus = await props.dispatch(getMyselfWorkspaceReadStatusList(idWorkspace))

    switch (fetchContentList.status) {
      case 200:
        const folderToOpen = [
          ...idFolderInUrl,
          ...fetchContentList.json.filter(c => c.parent_id !== null).map(c => c.parent_id)
        ]
        props.dispatch(setWorkspaceContentList(fetchContentList.json, folderToOpen))
        break
      case 401: break
      default: props.dispatch(newFlashMessage(props.t('Error while loading content list'), 'warning'))
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

    this.setState({contentLoaded: true})
  }

  handleClickContentItem = content => {
    console.log('%c<WorkspaceContent> content clicked', 'color: #c17838', content)
    this.props.history.push(`${PAGE.WORKSPACE.CONTENT(content.idWorkspace, content.type, content.id)}${this.props.location.search}`)
  }

  handleClickEditContentItem = (e, content) => {
    e.stopPropagation()
    this.handleClickContentItem(content)
  }

  handleClickMoveContentItem = (e, content) => {
    e.stopPropagation()
    console.log('%c<WorkspaceContent> move nyi', 'color: #c17838', content)
  }

  handleClickDownloadContentItem = (e, content) => {
    e.stopPropagation()
    console.log('%c<WorkspaceContent> download nyi', 'color: #c17838', content)
  }

  handleClickArchiveContentItem = async (e, content) => {
    const { props, state } = this

    e.stopPropagation()

    const fetchPutContentArchived = await props.dispatch(putWorkspaceContentArchived(content.idWorkspace, content.id))
    switch (fetchPutContentArchived.status) {
      case 204:
        props.dispatch(setWorkspaceContentArchived(content.idWorkspace, content.id))
        this.loadContentList(state.idWorkspaceInUrl)
        break
      default: props.dispatch(newFlashMessage(props.t('Error while archiving document')))
    }
  }

  handleClickDeleteContentItem = async (e, content) => {
    const { props, state } = this

    e.stopPropagation()

    const fetchPutContentDeleted = await props.dispatch(putWorkspaceContentDeleted(content.idWorkspace, content.id))
    switch (fetchPutContentDeleted.status) {
      case 204:
        props.dispatch(setWorkspaceContentDeleted(content.idWorkspace, content.id))
        this.loadContentList(state.idWorkspaceInUrl)
        break
      default: props.dispatch(newFlashMessage(props.t('Error while deleting document')))
    }
  }

  handleClickFolder = async idFolder => {
    const { props, state } = this

    const folderListInUrl = this.getIdFolderToOpenInUrl(props.location.search)
    const newUrlSearchList = (props.workspaceContentList.find(c => c.id === idFolder) || {isOpen: false}).isOpen
      ? folderListInUrl.filter(id => id !== idFolder)
      : uniq([...folderListInUrl, idFolder])

    const newUrlSearchObject = {
      ...qs.parse(props.location.search),
      folder_open: newUrlSearchList.join(',')
    }

    props.dispatch(toggleFolderOpen(idFolder))
    props.history.push(PAGE.WORKSPACE.CONTENT_LIST(state.idWorkspaceInUrl) + '?' + qs.stringify(newUrlSearchObject, {encode: false}))

    if (!props.workspaceContentList.some(c => c.idParent === idFolder)) {
      const fetchContentList = await props.dispatch(getFolderContentList(state.idWorkspaceInUrl, [idFolder]))
      if (fetchContentList.status === 200) props.dispatch(addWorkspaceContentList(fetchContentList.json))
    }
  }

  handleClickCreateContent = (e, idFolder, contentType) => {
    const { props, state } = this

    const folderOpen = (props.workspaceContentList.find(c => c.id === idFolder) || {isOpen: false}).isOpen

    const urlSearch = qs.parse(props.location.search)
    delete urlSearch.parent_id

    const folderListInUrl = this.getIdFolderToOpenInUrl(props.location.search)
    const newFolderOpenList = folderOpen
      ? folderListInUrl
      : uniq([...folderListInUrl, idFolder])

    const newUrlSearch = {
      ...urlSearch,
      folder_open: newFolderOpenList.join(',')
    }

    if (!folderOpen) this.handleClickFolder(idFolder)

    props.history.push(`${PAGE.WORKSPACE.NEW(state.idWorkspaceInUrl, contentType)}?${qs.stringify(newUrlSearch, {encode: false})}&parent_id=${idFolder}`)
  }

  handleUpdateAppOpenedType = openedAppType => this.setState({appOpenedType: openedAppType})

  handleSetFolderRead = async idFolder => {
    const { props, state } = this
    const fetchSetFolderRead = await props.dispatch(putFolderRead(props.user.user_id, state.idWorkspaceInUrl, idFolder))
    switch (fetchSetFolderRead.status) {
      case 204: props.dispatch(setWorkspaceContentRead(idFolder)); break
      default: console.log(`Error while setting folder ${idFolder} read status. fetchSetFolderRead: `, fetchSetFolderRead)
    }
  }

  getIdFolderToOpenInUrl = urlSearch => (qs.parse(urlSearch).folder_open || '').split(',').filter(str => str !== '').map(str => parseInt(str))

  getTitle = urlFilter => {
    const { props } = this
    const contentType = props.contentType.find(ct => ct.slug === urlFilter)
    return contentType
      ? `${props.t('List of')} ${props.t(contentType.label.toLowerCase() + 's')}`
      : props.t('List of contents')
  }

  getIcon = urlFilter => {
    const contentType = this.props.contentType.find(ct => ct.slug === urlFilter)
    return contentType
      ? contentType.faIcon
      : 'th'
  }

  filterWorkspaceContent = (contentList, filter) => filter.length === 0
    ? contentList
    : contentList.filter(c => c.type === 'folder' || filter.includes(c.type)) // keep unfiltered files and folders

  render () {
    const { user, currentWorkspace, workspaceContentList, contentType, location, t } = this.props
    const { state } = this

    const urlFilter = qs.parse(location.search).type

    const filteredWorkspaceContentList = workspaceContentList.length > 0
      ? this.filterWorkspaceContent(workspaceContentList, urlFilter ? [urlFilter] : [])
      : []

    const rootContentList = filteredWorkspaceContentList.filter(c => c.idParent === null) // .sort((a, b) => a.type !== 'folder' && b.type === 'folder')

    const idRoleUserWorkspace = findIdRoleUserWorkspace(user.user_id, currentWorkspace.memberList, ROLE)

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='WorkspaceContent' style={{width: '100%'}}>
          {state.contentLoaded &&
            <OpenContentApp
              // automatically open the app for the idContent in url
              idWorkspace={state.idWorkspaceInUrl}
              appOpenedType={state.appOpenedType}
              updateAppOpenedType={this.handleUpdateAppOpenedType}
            />
          }

          {state.contentLoaded &&
            <Route path={PAGE.WORKSPACE.NEW(':idws', ':type')} component={() =>
              <OpenCreateContentApp
                // automatically open the popup create content of the app in url
                idWorkspace={state.idWorkspaceInUrl}
                appOpenedType={state.appOpenedType}
              />
            } />
          }

          <PageWrapper customeClass='workspace'>
            <PageTitle
              parentClass='workspace__header'
              customClass='justify-content-between align-items-center'
              title={this.getTitle(urlFilter)}
              icon={this.getIcon(urlFilter)}
            >
              {idRoleUserWorkspace >= 2 &&
                <DropdownCreateButton
                  parentClass='workspace__header__btnaddcontent'
                  idFolder={null} // null because it is workspace root content
                  onClickCreateContent={this.handleClickCreateContent}
                  availableApp={contentType.filter(ct => ct.slug !== 'comment')} // @FIXME: Côme - 2018/08/21 - should use props.appList
                />
              }
            </PageTitle>

            <PageContent parentClass='workspace__content'>
              <div className='workspace__content__fileandfolder folder__content active'>
                <ContentItemHeader />

                {state.contentLoaded && workspaceContentList.length === 0
                  ? (
                    <div className='workspace__content__fileandfolder__empty'>
                      {t("This shared space has no content yet, create the first content by clicking on the button 'Create'")}
                    </div>
                  )
                  : rootContentList.map((content, i) => content.type === 'folder'
                    ? (
                      <Folder
                        availableApp={contentType.filter(ct => ct.slug !== 'comment')}
                        folderData={{
                          ...content,
                          content: filteredWorkspaceContentList.filter(c => c.idParent !== null)
                        }}
                        onClickItem={this.handleClickContentItem}
                        idRoleUserWorkspace={idRoleUserWorkspace}
                        onClickExtendedAction={{
                          edit: this.handleClickEditContentItem,
                          move: null, // this.handleClickMoveContentItem,
                          download: this.handleClickDownloadContentItem,
                          archive: this.handleClickArchiveContentItem,
                          delete: this.handleClickDeleteContentItem
                        }}
                        onClickFolder={this.handleClickFolder}
                        onClickCreateContent={this.handleClickCreateContent}
                        contentType={contentType}
                        readStatusList={currentWorkspace.contentReadStatusList}
                        setFolderRead={this.handleSetFolderRead}
                        isLast={i === rootContentList.length - 1}
                        key={content.id}
                        t={t}
                      />
                    )
                    : (
                      <ContentItem
                        label={content.label}
                        type={content.type}
                        faIcon={contentType.length ? contentType.find(a => a.slug === content.type).faIcon : ''}
                        statusSlug={content.statusSlug}
                        read={currentWorkspace.contentReadStatusList.includes(content.id)}
                        contentType={contentType.length ? contentType.find(ct => ct.slug === content.type) : null}
                        onClickItem={() => this.handleClickContentItem(content)}
                        idRoleUserWorkspace={idRoleUserWorkspace}
                        onClickExtendedAction={{
                          edit: e => this.handleClickEditContentItem(e, content),
                          move: null, // e => this.handleClickMoveContentItem(e, content),
                          download: e => this.handleClickDownloadContentItem(e, content),
                          archive: e => this.handleClickArchiveContentItem(e, content),
                          delete: e => this.handleClickDeleteContentItem(e, content)
                        }}
                        isLast={i === rootContentList.length - 1}
                        key={content.id}
                      />
                    )
                  )
                }

                {idRoleUserWorkspace >= 2 && workspaceContentList.length >= 10 &&
                  <DropdownCreateButton
                    customClass='workspace__content__button'
                    idFolder={null}
                    onClickCreateContent={this.handleClickCreateContent}
                    availableApp={contentType.filter(ct => ct.slug !== 'comment')} // @FIXME: Côme - 2018/08/21 - should use props.appList
                  />
                }
              </div>
            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, currentWorkspace, workspaceContentList, workspaceList, contentType }) => ({
  user, currentWorkspace, workspaceContentList, workspaceList, contentType
})
export default withRouter(connect(mapStateToProps)(appFactory(translate()(WorkspaceContent))))
