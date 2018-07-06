import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import appFactory from '../appFactory.js'
import { PAGE } from '../helper.js'
import Sidebar from './Sidebar.jsx'
import Folder from '../component/Workspace/Folder.jsx'
import ContentItem from '../component/Workspace/ContentItem.jsx'
import ContentItemHeader from '../component/Workspace/ContentItemHeader.jsx'
import PageWrapper from '../component/common/layout/PageWrapper.jsx'
import PageTitle from '../component/common/layout/PageTitle.jsx'
import PageContent from '../component/common/layout/PageContent.jsx'
import DropdownCreateButton from '../component/common/Input/DropdownCreateButton.jsx'
import OpenContentApp from './OpenContentApp.jsx'
import {
  getAppList,
  getContentTypeList,
  getWorkspaceContentList,
  getFolderContent,
  getWorkspaceList
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setAppList,
  setContentTypeList,
  setWorkspaceContent,
  setWorkspaceListIsOpenInSidebar,
  updateWorkspaceListData
} from '../action-creator.sync.js'

const qs = require('query-string')

class WorkspaceContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      popupCreateContent: {
        display: false,
        type: undefined,
        folder: undefined
      },
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null, // this is used to avoid handling the parseInt everytime
      appOpenedType: false
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    console.log(type, data)
    switch (type) {
      case 'openContentUrl':
        this.props.history.push(PAGE.WORKSPACE.CONTENT(data.idWorkspace, data.contentType, data.idContent))
        break
      case 'appClosed':
        this.props.history.push(PAGE.WORKSPACE.CONTENT_LIST(this.state.workspaceIdInUrl))
        this.setState({appOpened: false})
        break
    }
  }

  async componentDidMount () {
    const { workspaceIdInUrl } = this.state
    const { user, workspaceList, app, contentType, match, location, dispatch } = this.props

    console.log('<WorkspaceContent> componentDidMount')

    if (app.length === 0) {
      const fetchGetAppList = await dispatch(getAppList())
      if (fetchGetAppList.status === 200) dispatch(setAppList(fetchGetAppList.json))
    }

    if (contentType.length === 0) {
      const fetchGetContentTypeList = await dispatch(getContentTypeList())
      if (fetchGetContentTypeList.status === 200) dispatch(setContentTypeList(fetchGetContentTypeList.json))
    }

    let wsToLoad = null
    if (match.params.idws !== undefined) wsToLoad = match.params.idws

    if (user.user_id !== -1 && workspaceList.length === 0) {
      const fetchGetWorkspaceList = await dispatch(getWorkspaceList(user.user_id))

      if (fetchGetWorkspaceList.status === 200) {
        dispatch(updateWorkspaceListData(fetchGetWorkspaceList.json))
        dispatch(setWorkspaceListIsOpenInSidebar(workspaceIdInUrl || fetchGetWorkspaceList.json[0].workspace_id, true))

        if (match.params.idws === undefined && fetchGetWorkspaceList.json.length > 0) {
          wsToLoad = fetchGetWorkspaceList.json[0].workspace_id // load first ws if none specified
        }
      }
    }

    if (wsToLoad === null) return // ws already loaded

    const wsContent = await dispatch(getWorkspaceContentList(wsToLoad, 0))

    if (wsContent.status === 200) dispatch(setWorkspaceContent(wsContent.json, qs.parse(location.search).type))
    else dispatch(newFlashMessage('Error while loading workspace', 'danger'))
  }

  async componentDidUpdate (prevProps, prevState) {
    const { match, location, dispatch } = this.props

    console.log('<WorkspaceContent> componentDidUpdate')

    if (this.state.workspaceIdInUrl === null) return

    const idWorkspace = parseInt(match.params.idws)

    if (isNaN(idWorkspace)) return

    if (prevState.workspaceIdInUrl !== idWorkspace) {
      this.setState({workspaceIdInUrl: idWorkspace})

      const wsContent = await dispatch(getWorkspaceContentList(idWorkspace, 0))

      if (wsContent.status === 200) dispatch(setWorkspaceContent(wsContent.json, qs.parse(location.search).type))
      else dispatch(newFlashMessage('Error while loading workspace', 'danger'))
    }

    // if (user.user_id !== -1 && prevProps.user.id !== user.id) dispatch(getWorkspaceList(user.user_id, idWorkspace))
  }

  componentWillUnmount () {
    this.props.emitEventApp('unmount_app')
  }

  handleClickContentItem = content => {
    console.log('content clicked', content)
    this.props.history.push(`/workspaces/${content.idWorkspace}/${content.type}/${content.id}`)
  }

  handleClickEditContentItem = (e, content) => {
    e.stopPropagation()
    console.log('edit nyi', content)
  }

  handleClickMoveContentItem = (e, content) => {
    e.stopPropagation()
    console.log('move nyi', content)
  }

  handleClickDownloadContentItem = (e, content) => {
    e.stopPropagation()
    console.log('download nyi', content)
  }

  handleClickArchiveContentItem = (e, content) => {
    e.stopPropagation()
    console.log('archive nyi', content)
  }

  handleClickDeleteContentItem = (e, content) => {
    e.stopPropagation()
    console.log('delete nyi', content)
  }

  handleClickFolder = folderId => {
    this.props.dispatch(getFolderContent(this.props.workspace.id, folderId))
  }

  handleClickCreateContent = (e, idFolder, contentType) => {
    e.stopPropagation()
    this.props.renderCreateContentApp(
      this.props.contentType.find(ct => ct.slug === contentType),
      this.props.user,
      this.props.match.params.idws,
      idFolder
    )
  }

  handleUpdateAppOpenedType = openedAppType => this.setState({appOpenedType: openedAppType})

  render () {
    const { workspaceContent, contentType, match } = this.props

    const filterWorkspaceContent = (contentList, filter) => {
      return filter.length === 0
        ? contentList
        : contentList.filter(c => c.type === 'folder' || filter.includes(c.type)) // keep unfiltered files and folders
      // @FIXME we need to filter subfolder too, but right now, we dont handle subfolder
      // .map(c => c.type !== 'folder' ? c : {...c, content: filterWorkspaceContent(c.content, filter)}) // recursively filter folder content
    }
    // .filter(c => c.type !== 'folder' || c.content.length > 0) // remove empty folder => 2018/05/21 - since we load only one lvl of content, don't remove empty

    const urlFilter = qs.parse(this.props.location.search).type

    const filteredWorkspaceContent = workspaceContent.length > 0
      ? filterWorkspaceContent(workspaceContent, urlFilter ? [urlFilter] : [])
      : []
    console.log('workspaceContent => filteredWorkspaceContent', filteredWorkspaceContent, 'urlFilter', urlFilter)

    return (
      <div className='sidebarpagecontainer'>
        <Sidebar />

        <OpenContentApp
          idWorkspace={match.params.idws}
          appOpenedType={this.state.appOpenedType}
          updateAppOpenedType={this.handleUpdateAppOpenedType}
        />

        <PageWrapper customeClass='workspace'>
          <PageTitle
            parentClass='workspace__header'
            customClass='justify-content-between'
            title={workspaceContent.label ? workspaceContent.label : ''}
          >
            <DropdownCreateButton
              parentClass='workspace__header__btnaddworkspace'
              idFolder={null}
              onClickCreateContent={this.handleClickCreateContent}
              availableApp={contentType}
            />
          </PageTitle>

          <PageContent parentClass='workspace__content'>
            <div id='popupCreateContentContainer' />

            <div className='workspace__content__fileandfolder folder__content active'>
              <ContentItemHeader />

              { filteredWorkspaceContent.map((c, i) => c.type === 'folder'
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
                    isLast={i === filteredWorkspaceContent.length - 1}
                    key={c.id}
                  />
                )
                : (
                  <ContentItem
                    label={c.label}
                    type={c.type}
                    faIcon={contentType.length ? contentType.find(a => a.slug === c.type).faIcon : ''}
                    statusSlug={c.statusSlug}
                    contentType={contentType.find(ct => ct.slug === c.type)}
                    onClickItem={() => this.handleClickContentItem(c)}
                    onClickExtendedAction={{
                      edit: e => this.handleClickEditContentItem(e, c),
                      move: e => this.handleClickMoveContentItem(e, c),
                      download: e => this.handleClickDownloadContentItem(e, c),
                      archive: e => this.handleClickArchiveContentItem(e, c),
                      delete: e => this.handleClickDeleteContentItem(e, c)
                    }}
                    onClickCreateContent={this.handleClickCreateContent}
                    isLast={i === filteredWorkspaceContent.length - 1}
                    key={c.id}
                  />
                )
              )}
            </div>

            <DropdownCreateButton
              customClass='workspace__content__button mb-5'
              idFolder={null}
              onClickCreateContent={this.handleClickCreateContent}
              availableApp={contentType}
            />

            <div id='appContainer' />
          </PageContent>

        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceContent, workspaceList, app, contentType }) => ({ user, workspaceContent, workspaceList, app, contentType })
export default withRouter(connect(mapStateToProps)(appFactory(WorkspaceContent)))
