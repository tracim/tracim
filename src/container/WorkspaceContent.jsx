import React from 'react'
import { connect } from 'react-redux'
import appFactory from '../appFactory.js'
import Folder from '../component/Workspace/Folder.jsx'
import FileItem from '../component/Workspace/FileItem.jsx'
import FileItemHeader from '../component/Workspace/FileItemHeader.jsx'
import PageWrapper from '../component/common/layout/PageWrapper.jsx'
import PageTitle from '../component/common/layout/PageTitle.jsx'
import PageContent from '../component/common/layout/PageContent.jsx'
import DropdownCreateButton from '../component/common/Input/DropdownCreateButton.jsx'
import {
  getAppList,
  getWorkspaceContent
} from '../action-creator.async.js'

class WorkspaceContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      activeFileType: ''
    }
  }

  componentDidMount () {
    const { workspaceList, app, match, dispatch } = this.props

    if (match.params.idws !== undefined) dispatch(getWorkspaceContent(match.params.idws))
    else if (workspaceList.length > 0) dispatch(getWorkspaceContent(workspaceList[0].id)) // load first ws if none specified

    Object.keys(app).length === 0 && dispatch(getAppList())
  }

  componentDidUpdate (prevProps) {
    const { workspace, workspaceList, match, dispatch } = this.props

    // if a workspace is already loaded and the idws in url hasn't changed, do nothing
    if (workspace.id !== -1 && prevProps.match.params.idws === match.params.idws) return

    // if the idws in url has changed, load the new workspace
    if (match.params.idws !== undefined) dispatch(getWorkspaceContent(match.params.idws))
    // else bellow is for loading url PAGE_NAME.HOME (without an idws), when workspaceList is loaded, load the first workspace
    else if (match.params.idws === undefined && workspace.id === -1 && workspaceList.length > 0) dispatch(getWorkspaceContent(workspaceList[0].id))
  }

  handleClickContentItem = content => {
    this.props.renderApp(this.props.user, this.props.workspace, this.props.app, content)
    // Côme - 2018/03/08 - line bellow is useless because we cannot call the reducer again when hiding app since the call comes from the app
    // dispatch(setActiveFileContentActive(content))
  }

  render () {
    const { workspace, app } = this.props

    return (
      <PageWrapper customeClass='workspace'>
        <PageTitle
          parentClass='workspace__header'
          customClass='justify-content-between'
          title={workspace.title}
        >
          <DropdownCreateButton parentClass='workspace__header__btnaddworkspace' />
        </PageTitle>

        <PageContent parentClass='workspace__content'>
          <div className='workspace__content__fileandfolder folder__content active'>
            <FileItemHeader />

            { workspace.content.map((c, i) => c.type === 'folder'
              ? (
                <Folder
                  app={app}
                  folderData={c}
                  onClickItem={this.handleClickContentItem}
                  isLast={i === workspace.content.length - 1}
                  key={c.id}
                />
              )
              : (
                <FileItem
                  name={c.title}
                  type={c.type}
                  icon={(app[c.type] || {icon: ''}).icon}
                  status={c.status}
                  onClickItem={() => this.handleClickContentItem(c)}
                  isLast={i === workspace.content.length - 1}
                  key={c.id}
                />
              )
            )}
          </div>

          <DropdownCreateButton customClass='workspace__content__button mb-5' />

          <div id='appContainer' />
        </PageContent>

      </PageWrapper>
    )
  }
}

const mapStateToProps = ({ user, workspace, workspaceList, app }) => ({ user, workspace, workspaceList, app })
export default connect(mapStateToProps)(appFactory(WorkspaceContent))
