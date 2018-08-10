import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Route } from 'react-router-dom'
import appFactory from '../appFactory.js'
import { PAGE } from '../helper.js'
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
  getFolderContent,
  putWorkspaceContentArchived,
  putWorkspaceContentDeleted
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceContentList,
  setWorkspaceContentArchived,
  setWorkspaceContentDeleted
} from '../action-creator.sync.js'

const qs = require('query-string')

class WorkspaceContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null, // this is used to avoid handling the parseInt every time
      appOpenedType: false
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    switch (type) {
      case 'refreshContentList':
        console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', type, data)
        this.loadContentList(this.state.workspaceIdInUrl)
        break

      case 'openContentUrl':
        console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', type, data)
        this.props.history.push(PAGE.WORKSPACE.CONTENT(data.idWorkspace, data.contentType, data.idContent))
        break

      case 'appClosed':
      case 'hide_popupCreateContent':
        console.log('%c<WorkspaceContent> Custom event', 'color: #28a745', type, data, this.state.workspaceIdInUrl)
        this.props.history.push(PAGE.WORKSPACE.CONTENT_LIST(this.state.workspaceIdInUrl))
        this.setState({appOpenedType: false})
        break
    }
  }

  async componentDidMount () {
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

    // if (user.user_id !== -1 && prevProps.user.id !== user.id) dispatch(getWorkspaceList(user.user_id, idWorkspace))
  }

  componentWillUnmount () {
    this.props.dispatchCustomEvent('unmount_app')
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadContentList = async idWorkspace => {
    const { user, location, dispatch } = this.props

    const wsContent = await dispatch(getWorkspaceContentList(user, idWorkspace, 0))

    if (wsContent.status === 200) dispatch(setWorkspaceContentList(wsContent.json, qs.parse(location.search).type))
    else dispatch(newFlashMessage('Error while loading workspace', 'danger'))
  }

  handleClickContentItem = content => {
    console.log('%c<WorkspaceContent> content clicked', 'color: #c17838', content)
    this.props.history.push(PAGE.WORKSPACE.CONTENT(content.idWorkspace, content.type, content.id))
  }

  handleClickEditContentItem = (e, content) => {
    e.stopPropagation()
    console.log('%c<WorkspaceContent> edit nyi', 'color: #c17838', content)
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
    this.props.history.push(`${PAGE.WORKSPACE.NEW(this.state.workspaceIdInUrl, contentType, idFolder)}?parent_id=${idFolder}`)
  }

  handleUpdateAppOpenedType = openedAppType => this.setState({appOpenedType: openedAppType})

  render () {
    const { workspaceContentList, contentType } = this.props

    const filterWorkspaceContent = (contentList, filter) => {
      return filter.length === 0
        ? contentList
        : contentList.filter(c => c.type === 'folder' || filter.includes(c.type)) // keep unfiltered files and folders
      // @FIXME we need to filter subfolder too, but right now, we dont handle subfolder
      // .map(c => c.type !== 'folder' ? c : {...c, content: filterWorkspaceContent(c.content, filter)}) // recursively filter folder content
    }
    // .filter(c => c.type !== 'folder' || c.content.length > 0) // remove empty folder => 2018/05/21 - since we load only one lvl of content, don't remove empty

    const urlFilter = qs.parse(this.props.location.search).type

    const filteredWorkspaceContentList = workspaceContentList.length > 0
      ? filterWorkspaceContent(workspaceContentList, urlFilter ? [urlFilter] : [])
      : []

    return (
      <div className='WorkspaceContent' style={{width: '100%'}}>
        <OpenContentApp
          // automatically open the app for the idContent in url
          idWorkspace={this.state.workspaceIdInUrl}
          appOpenedType={this.state.appOpenedType}
          updateAppOpenedType={this.handleUpdateAppOpenedType}
        />

        <Route path={PAGE.WORKSPACE.NEW(':idws', ':type')} component={() =>
          <OpenCreateContentApp
            // automatically open the popup create content of the app in url
            idWorkspace={this.state.workspaceIdInUrl}
            appOpenedType={this.state.appOpenedType}
          />
        } />

        <PageWrapper customeClass='workspace'>
          <PageTitle
            parentClass='workspace__header'
            customClass='justify-content-between'
            title='Liste des Contenus'
            subtitle={workspaceContentList.label ? workspaceContentList.label : ''}
          >
            <DropdownCreateButton
              parentClass='workspace__header__btnaddcontent'
              idFolder={null} // null because it is workspace root content
              onClickCreateContent={this.handleClickCreateContent}
              availableApp={contentType}
            />
          </PageTitle>

          <PageContent parentClass='workspace__content'>
            <div className='workspace__content__fileandfolder folder__content active'>
              <ContentItemHeader />

              { filteredWorkspaceContentList.map((c, i) => c.type === 'folder'
                ? (
                  <Folder
                    availableApp={contentType}
                    folderData={c}
                    onClickItem={this.handleClickContentItem}
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
                    contentType={contentType.length ? contentType.find(ct => ct.slug === c.type) : null}
                    onClickItem={() => this.handleClickContentItem(c)}
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
              )}
            </div>

            <DropdownCreateButton
              customClass='workspace__content__button'
              idFolder={null}
              onClickCreateContent={this.handleClickCreateContent}
              availableApp={contentType}
            />
          </PageContent>

        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceContentList, workspaceList, contentType }) => ({ user, workspaceContentList, workspaceList, contentType })
export default withRouter(connect(mapStateToProps)(appFactory(WorkspaceContent)))
