import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
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
import {
  getAppList,
  getContentTypeList,
  getWorkspaceContentList,
  // getWorkspaceContent,
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
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null,
      workspaceOpened: false
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case 'openContentUrl':
        this.props.history.push(PAGE.WORKSPACE.CONTENT(data.idWorkspace, data.idContent))
        break
      case 'appClosed':
        this.props.history.push(PAGE.WORKSPACE.CONTENT(this.props.workspace.id, ''))
        this.setState({workspaceOpened: false})
        break
    }
  }

  async componentDidMount () {
    const { workspaceIdInUrl } = this.state
    const { user, workspaceList, app, contentType, match, location, dispatch } = this.props

    console.log('componentDidMount')

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
        dispatch(setWorkspaceListIsOpenInSidebar(workspaceIdInUrl || fetchGetWorkspaceList.json[0].id, true))

        if (match.params.idws === undefined && fetchGetWorkspaceList.json.length > 0) {
          wsToLoad = fetchGetWorkspaceList.json[0].id // load first ws if none specified
        }
      }
    }

    if (wsToLoad === null) return // ws already loaded

    const wsContent = await dispatch(getWorkspaceContentList(wsToLoad))

    if (wsContent.status === 200) dispatch(setWorkspaceContent(wsContent.json, qs.parse(location.search).type))
    else dispatch(newFlashMessage('Error while loading workspace', 'danger'))
  }

  componentDidUpdate (prevProps, prevState) {
    const { contentType, workspaceContent, user, renderApp, match } = this.props

    console.log('componentDidUpdate')

    if (this.state.workspaceIdInUrl === null) return

    const idWorkspace = parseInt(match.params.idws)
    if (prevState.workspaceIdInUrl !== idWorkspace) this.setState({workspaceIdInUrl: idWorkspace})

    // if (user.user_id !== -1 && prevProps.user.id !== user.id) dispatch(getWorkspaceList(user.user_id, idWorkspace))

    if (match.params.idcts && workspaceContent.id !== -1 && !workspaceOpened && workspaceContent.length) { // if a content id is in url, open it
      const idContentToOpen = parseInt(match.params.idcts)
      const contentToOpen = workspaceContent.find(wsc => wsc.id === idContentToOpen) // || await dispatch(getWorkspaceContent(idWorkspace, idContentToOpen))

      // @FIXME : for alpha, we do not handle subfolder. commented code bellow should load a component that is not in the workspace root
      // if (contentToOpen === undefined) { // content is not is ws root
      //   const fetchContent = await dispatch(getWorkspaceContent(idWorkspace, idContentToOpen))
      //   console.log(fetchContent)
      // }

      console.log('contentToOpen', contentToOpen)

      renderApp(
        contentType.find(ct => ct.type === contentToOpen.type),
        user,
        {...contentToOpen, workspaceContent: workspaceContent}
      )
      this.setState({workspaceOpened: true})
    }
  }

  handleClickContentItem = content => {
    console.log('content clicked', content)
    this.props.history.push(`${PAGE.WORKSPACE.CONTENT(content.workspaceId, content.id)}${this.props.location.search}`)
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

  handleClickCreateContent = (folder, contentType) => {
    this.props.renderCreateContentApp(this.props.app[contentType], this.props.user, folder)
  }

  render () {
    const { workspaceContent, app, contentType } = this.props

    const filterWorkspaceContent = (contentList, filter) => {
      console.log(contentList, filter)
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
    console.log('workspaceContent => filteredWorkspaceContent', filteredWorkspaceContent)

    return (
      <div className='sidebarpagecontainer'>
        <Sidebar />

        <PageWrapper customeClass='workspace'>
          <PageTitle
            parentClass='workspace__header'
            customClass='justify-content-between'
            title={workspaceContent.label ? workspaceContent.label : ''}
          >
            <DropdownCreateButton parentClass='workspace__header__btnaddworkspace' />
          </PageTitle>

          <PageContent parentClass='workspace__content'>
            <div id='popupCreateContentContainer' />

            <div className='workspace__content__fileandfolder folder__content active'>
              <ContentItemHeader />

              { filteredWorkspaceContent.map((c, i) => c.type === 'folder'
                ? (
                  <Folder
                    app={app}
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
                    isLast={i === filteredWorkspaceContent.length - 1}
                    key={c.id}
                  />
                )
              )}
            </div>

            <DropdownCreateButton customClass='workspace__content__button mb-5' />

            <div id='appContainer' />
          </PageContent>

        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceContent, workspaceList, app, contentType }) => ({ user, workspaceContent, workspaceList, app, contentType })
export default withRouter(connect(mapStateToProps)(appFactory(WorkspaceContent)))
