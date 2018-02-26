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
import { setActiveFileContent, hideActiveFileContent } from '../action-creator.sync.js'
import PopinFixed from '../component/common/PopinFixed/PopinFixed.jsx'
import PopinFixedHeader from '../component/common/PopinFixed/PopinFixedHeader.jsx'
import PopinFixedOption from '../component/common/PopinFixed/PopinFixedOption.jsx'
import PopinFixedContent from '../component/common/PopinFixed/PopinFixedContent.jsx'
import PluginContentType from '../component/PluginContentType.jsx'

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
    console.log(file)
    this.props.dispatch(setActiveFileContent(file))
  }

  handleClickCloseBtn = () => {
    this.props.dispatch(hideActiveFileContent())
  }

  render () {
    const { workspace, activeFileContent, plugin } = this.props

    const pluginContent = (() => {
      switch (activeFileContent.type) {
        case 'PageHtml':
          return <PopinFixed customClass={`${plugin.pageHtml.customClass}`}>
            <PopinFixedHeader
              customClass={`${plugin.pageHtml.customClass}`}
              icon={plugin.pageHtml.icon}
              name={activeFileContent.title}
              onClickCloseBtn={this.handleClickCloseBtn}
            />

            <PopinFixedOption customClass={`${plugin.pageHtml.customClass}`} />

            <PopinFixedContent customClass={`${plugin.pageHtml.customClass}__contentpage`}>
              <PluginContentType
                file={activeFileContent}
                customClass={`${plugin.pageHtml.customClass}`}
              />
            </PopinFixedContent>
          </PopinFixed>
      }
    })()

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
                  onClickItem={() => this.handleClickFileItem(c)}
                  key={c.id}
                />
              )
            )}
          </div>

          <DropdownCreateButton customClass='workspace__content__button mb-5' />

          <div id='pluginContainer'>
            { activeFileContent.display && pluginContent }
          </div>
        </PageContent>

      </PageWrapper>
    )
  }
}

const mapStateToProps = ({ workspace, activeFileContent, plugin }) => ({ workspace, activeFileContent, plugin })
export default connect(mapStateToProps)(WorkspaceContent)
