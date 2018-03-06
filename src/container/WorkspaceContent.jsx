import React from 'react'
import { connect } from 'react-redux'
import Folder from '../component/Workspace/Folder.jsx'
import FileItem from '../component/Workspace/FileItem.jsx'
import FileItemHeader from '../component/Workspace/FileItemHeader.jsx'
import PageWrapper from '../component/common/layout/PageWrapper.jsx'
import PageTitle from '../component/common/layout/PageTitle.jsx'
import PageContent from '../component/common/layout/PageContent.jsx'
import DropdownCreateButton from '../component/common/Input/DropdownCreateButton.jsx'
import { FETCH_CONFIG } from '../helper.js'
import {
  getAppList,
  getWorkspaceContent
} from '../action-creator.async.js'
// import appDatabase from '../app/index.js'

class WorkspaceContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      activeFileType: ''
    }
  }

  componentDidMount () {
    this.props.dispatch(getWorkspaceContent(/* this.props.workspace.id */1))
    this.props.dispatch(getAppList())
  }

  handleClickContentItem = content => {
    const { user, workspace } = this.props
    GLOBAL_renderApp({
      workspace: {
        id: workspace.id,
        title: workspace.title
      },
      appConfig: {
        ...this.props.app[content.type],
        apiUrl: FETCH_CONFIG.apiUrl
      },
      loggedUser: user.isLoggedIn ? user : {},
      content,
    })
  }

  render () {
    const { workspace, app } = this.props

    // const AppContainer = (appDatabase.find(p => p.name === activeFileContent.type) || {container: '<div>unknow</div>'}).container

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

            { workspace.content.map(c => c.type === 'folder'
              ? <Folder app={app} folderData={c} key={c.id} />
              : (
                <FileItem
                  name={c.title}
                  type={c.type}
                  icon={(app[c.type] || {icon: ''}).icon}
                  status={c.status}
                  onClickItem={() => this.handleClickContentItem(c)}
                  key={c.id}
                />
              )
            )}
          </div>

          <DropdownCreateButton customClass='workspace__content__button mb-5' />

          <div id='appContainer'>
            {/* activeFileContent.display && <AppContainer /> */}
          </div>
        </PageContent>

      </PageWrapper>
    )
  }
}

const mapStateToProps = ({ user, workspace, activeFileContent, app }) => ({ user, workspace, activeFileContent, app })
export default connect(mapStateToProps)(WorkspaceContent)
