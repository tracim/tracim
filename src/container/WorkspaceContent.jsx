import React from 'react'
import { connect } from 'react-redux'
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

  handleClickFileItem = file => {
    GLOBAL_renderApp({
      file,
      appData: this.props.app[file.type]
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
                  onClickItem={() => this.handleClickFileItem(c)}
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

const mapStateToProps = ({ workspace, activeFileContent, app }) => ({ workspace, activeFileContent, app })
export default connect(mapStateToProps)(WorkspaceContent)
