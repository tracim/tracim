import React from 'react'
import { connect } from 'react-redux'
import Folder from '../component/Workspace/Folder.jsx'
import FileItem from '../component/Workspace/FileItem.jsx'
import FileItemHeader from '../component/Workspace/FileItemHeader.jsx'
// import Thread from './FileType/Thread.jsx'
import PageHtml from './FileType/PageHtml.jsx'
import PageWrapper from '../component/common/layout/PageWrapper.jsx'
import PageTitle from '../component/common/layout/PageTitle.jsx'
import PageContent from '../component/common/layout/PageContent.jsx'
import DropdownCreateButton from '../component/common/Input/DropdownCreateButton.jsx'
import { getWorkspaceContent } from '../action-creator.async.js'

class WorkspaceContent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      activeFileType: ''
    }
  }

  componentDidMount () {
    this.props.dispatch(getWorkspaceContent(/* this.props.workspace.id */1))
  }

  render () {
    const { workspace } = this.props

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
              ? <Folder folderData={c} key={c.id} />
              : (
                <FileItem
                  name={c.title}
                  type={c.type}
                  status={c.status}
                  onClickItem={() => this.setState({activeFileType: 'file'})}
                  key={c.id}
                />
              )
            )}
          </div>

          <DropdownCreateButton customClass='workspace__content__button mb-5' />

          <PageHtml visible={this.state.activeFileType === 'file'} />
          {/*
          <Thread visible={this.state.activeFileType === 'chat'} />
          */}
        </PageContent>

      </PageWrapper>
    )
  }
}

const mapStateToProps = ({ workspace }) => ({ workspace })
export default connect(mapStateToProps)(WorkspaceContent)
