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
  getPluginList,
  getWorkspaceContent
} from '../action-creator.async.js'
// import pluginDatabase from '../plugin/index.js'

class WorkspaceContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      activeFileType: ''
    }
  }

  componentDidMount () {
    this.props.dispatch(getWorkspaceContent(/* this.props.workspace.id */1))
    this.props.dispatch(getPluginList())
  }

  handleClickFileItem = file => {
    GLOBAL_renderPlugin({
      file,
      pluginData: this.props.plugin[file.type]
    })
  }

  render () {
    const { workspace, plugin } = this.props

    // const PluginContainer = (pluginDatabase.find(p => p.name === activeFileContent.type) || {container: '<div>unknow</div>'}).container

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
              ? <Folder plugin={plugin} folderData={c} key={c.id} />
              : (
                <FileItem
                  name={c.title}
                  type={c.type}
                  icon={(plugin[c.type] || {icon: ''}).icon}
                  status={c.status}
                  onClickItem={() => this.handleClickFileItem(c)}
                  key={c.id}
                />
              )
            )}
          </div>

          <DropdownCreateButton customClass='workspace__content__button mb-5' />

          <div id='pluginContainer'>
            {/* activeFileContent.display && <PluginContainer /> */}
          </div>
        </PageContent>

      </PageWrapper>
    )
  }
}

const mapStateToProps = ({ workspace, activeFileContent, plugin }) => ({ workspace, activeFileContent, plugin })
export default connect(mapStateToProps)(WorkspaceContent)
