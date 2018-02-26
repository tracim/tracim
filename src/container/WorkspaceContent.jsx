import React from 'react'
import { connect } from 'react-redux'
import Folder from '../component/Workspace/Folder.jsx'
import FileItem from '../component/Workspace/FileItem.jsx'
import FileItemHeader from '../component/Workspace/FileItemHeader.jsx'
import PageWrapper from '../component/common/layout/PageWrapper.jsx'
import PageTitle from '../component/common/layout/PageTitle.jsx'
import PageContent from '../component/common/layout/PageContent.jsx'
import DropdownCreateButton from '../component/common/Input/DropdownCreateButton.jsx'
// import pluginDatabase from '../plugin/index.js'
import {
  getPluginList,
  getWorkspaceContent
} from '../action-creator.async.js'
import { setActiveFileContent } from '../action-creator.sync.js'
import { bonjour } from 'tracim_lib'

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
    // this.props.dispatch(setActiveFileContent(file))
    GLOBAL_renderPlugin(file.type)
  }

  handleDummyBtn = () => {
    // GLOBAL_dispatchEvent({
    //   source: 'Tracim',
    //   type: 'PageHtml_showMsg',
    //   content: 'Bonjour ?'
    // })
    bonjour()
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
          <button onClick={this.handleDummyBtn}>Click Me</button>

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
