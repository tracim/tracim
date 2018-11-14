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
  getWorkspaceContentList,
  getWorkspaceMemberList,
  getFolderContent,
  putWorkspaceContentArchived,
  putWorkspaceContentDeleted,
  getMyselfWorkspaceReadStatusList
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceContentList,
  setWorkspaceContentArchived,
  setWorkspaceContentDeleted,
  setWorkspaceMemberList,
  setWorkspaceReadStatusList
} from '../action-creator.sync.js'

const qs = require('query-string')

class WorkspaceContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null, // this is used to avoid handling the parseInt every time
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
        this.loadContentList(state.workspaceIdInUrl)
        break

      case 'openContentUrl':
        console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', type, data)
        props.history.push(PAGE.WORKSPACE.CONTENT(data.idWorkspace, data.contentType, data.idContent))
        break

      case 'appClosed':
      case 'hide_popupCreateContent':
        console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', type, data, state.workspaceIdInUrl)
        props.history.push(PAGE.WORKSPACE.CONTENT_LIST(state.workspaceIdInUrl) + props.location.search)
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

  async componentDidUpdate (prevProps, prevState) {
    console.log('%c<WorkspaceContent> componentDidUpdate', 'color: #c17838')

    if (this.state.workspaceIdInUrl === null) return

    const idWorkspace = parseInt(this.props.match.params.idws)
    if (isNaN(idWorkspace)) return

    const prevFilter = qs.parse(prevProps.location.search).type
    const currentFilter = qs.parse(this.props.location.search).type

    if (prevState.workspaceIdInUrl !== idWorkspace || prevFilter !== currentFilter) {
      this.setState({workspaceIdInUrl: idWorkspace})
      this.loadContentList(idWorkspace)
    }

    // if (user.user_id !== -1 && prevProps.user.id !== user.id) dispatch(getMyselfWorkspaceList(user.user_id, idWorkspace))
  }

  componentWillUnmount () {
    this.props.dispatchCustomEvent('unmount_app')
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadContentList = async idWorkspace => {
    const { user, dispatch, t } = this.props

    const wsContent = await dispatch(getWorkspaceContentList(user, idWorkspace, 0))
    const wsMember = await dispatch(getWorkspaceMemberList(idWorkspace))
    const wsReadStatus = await dispatch(getMyselfWorkspaceReadStatusList(idWorkspace))

    switch (wsContent.status) {
      case 200: dispatch(setWorkspaceContentList(wsContent.json)); break
      case 401: break
      default: dispatch(newFlashMessage('Error while loading workspace', 'danger'))
    }

    switch (wsMember.status) {
      case 200: dispatch(setWorkspaceMemberList(wsMember.json)); break
      case 401: break
      default: dispatch(newFlashMessage('Error while loading members list', 'warning'))
    }

    switch (wsReadStatus.status) {
      case 200: dispatch(setWorkspaceReadStatusList(wsReadStatus.json)); break
      case 401: break
      default: dispatch(newFlashMessage(`${t('Error while loading read status list')}`, 'warning'))
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

    const fetchPutContentArchived = await props.dispatch(putWorkspaceContentArchived(props.user, content.idWorkspace, content.id))
    switch (fetchPutContentArchived.status) {
      case 204:
        props.dispatch(setWorkspaceContentArchived(content.idWorkspace, content.id))
        this.loadContentList(state.workspaceIdInUrl)
        break
      default: props.dispatch(newFlashMessage(props.t('Error while archiving document')))
    }
  }

  handleClickDeleteContentItem = async (e, content) => {
    const { props, state } = this

    e.stopPropagation()

    const fetchPutContentDeleted = await props.dispatch(putWorkspaceContentDeleted(props.user, content.idWorkspace, content.id))
    switch (fetchPutContentDeleted.status) {
      case 204:
        props.dispatch(setWorkspaceContentDeleted(content.idWorkspace, content.id))
        this.loadContentList(state.workspaceIdInUrl)
        break
      default: props.dispatch(newFlashMessage(props.t('Error while deleting document')))
    }
  }

  handleClickFolder = folderId => {
    this.props.dispatch(getFolderContent(this.props.workspace.id, folderId))
  }

  handleClickCreateContent = (e, idFolder, contentType) => {
    e.stopPropagation()
    this.props.history.push(`${PAGE.WORKSPACE.NEW(this.state.workspaceIdInUrl, contentType)}?parent_id=${idFolder}`)
  }

  handleUpdateAppOpenedType = openedAppType => this.setState({appOpenedType: openedAppType})

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
    // @FIXME we need to filter subfolder too, but right now, we dont handle subfolder
    // .map(c => c.type !== 'folder' ? c : {...c, content: filterWorkspaceContent(c.content, filter)}) // recursively filter folder content
    // .filter(c => c.type !== 'folder' || c.content.length > 0) // remove empty folder => 2018/05/21 - since we load only one lvl of content, don't remove empty

  render () {
    const { user, currentWorkspace, workspaceContentList, contentType, location, t } = this.props
    const { state } = this

    const urlFilter = qs.parse(location.search).type

    const filteredWorkspaceContentList = workspaceContentList.length > 0
      ? this.filterWorkspaceContent(workspaceContentList, urlFilter ? [urlFilter] : [])
      : []

    const idRoleUserWorkspace = findIdRoleUserWorkspace(user.user_id, currentWorkspace.memberList, ROLE)

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='WorkspaceContent' style={{width: '100%'}}>
          {state.contentLoaded &&
            <OpenContentApp
              // automatically open the app for the idContent in url
              idWorkspace={state.workspaceIdInUrl}
              appOpenedType={state.appOpenedType}
              updateAppOpenedType={this.handleUpdateAppOpenedType}
            />
          }

          {state.contentLoaded &&
            <Route path={PAGE.WORKSPACE.NEW(':idws', ':type')} component={() =>
              <OpenCreateContentApp
                // automatically open the popup create content of the app in url
                idWorkspace={state.workspaceIdInUrl}
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
                  : filteredWorkspaceContentList.map((c, i) => c.type === 'folder'
                    ? (
                      <Folder
                        availableApp={contentType.filter(ct => ct.slug !== 'comment')} // @FIXME: Côme - 2018/08/21 - should use props.appList
                        folderData={c}
                        onClickItem={this.handleClickContentItem}
                        idRoleUserWorkspace={idRoleUserWorkspace}
                        onClickExtendedAction={{
                          edit: this.handleClickEditContentItem,
                          move: this.handleClickMoveContentItem,
                          download: this.handleClickDownloadContentItem,
                          archive: this.handleClickArchiveContentItem,
                          delete: this.handleClickDeleteContentItem
                        }}
                        onClickFolder={this.handleClickFolder}
                        onClickCreateContent={this.handleClickCreateContent}
                        isLast={i === filteredWorkspaceContentList.length - 1}
                        key={c.id}
                      />
                    )
                    : (
                      <ContentItem
                        label={c.label}
                        type={c.type}
                        faIcon={contentType.length ? contentType.find(a => a.slug === c.type).faIcon : ''}
                        statusSlug={c.statusSlug}
                        read={currentWorkspace.contentReadStatusList.includes(c.id)}
                        contentType={contentType.length ? contentType.find(ct => ct.slug === c.type) : null}
                        onClickItem={() => this.handleClickContentItem(c)}
                        idRoleUserWorkspace={idRoleUserWorkspace}
                        onClickExtendedAction={{
                          edit: e => this.handleClickEditContentItem(e, c),
                          move: e => this.handleClickMoveContentItem(e, c),
                          download: e => this.handleClickDownloadContentItem(e, c),
                          archive: e => this.handleClickArchiveContentItem(e, c),
                          delete: e => this.handleClickDeleteContentItem(e, c)
                        }}
                        onClickCreateContent={this.handleClickCreateContent}
                        isLast={i === filteredWorkspaceContentList.length - 1}
                        key={c.id}
                      />
                    )
                  )
                }

                {idRoleUserWorkspace >= 2 &&
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
