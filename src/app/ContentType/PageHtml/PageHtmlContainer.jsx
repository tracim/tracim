import React from 'react'
import { connect } from 'react-redux'
// import PopinFixed from '../../../component/common/PopinFixed/PopinFixed.jsx'
// import PopinFixedHeader from '../../../component/common/PopinFixed/PopinFixedHeader.jsx'
// import PopinFixedOption from '../../../component/common/PopinFixed/PopinFixedOption.jsx'
// import PopinFixedContent from '../../../component/common/PopinFixed/PopinFixedContent.jsx'
import {
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent
} from 'tracim_lib'
import PageHtmlComponent from './PageHtmlComponent.jsx'
import Timeline from '../../../component/Timeline.jsx'
import { setActiveFileContentHide } from '../../../action-creator.sync.js'

require('./PageHtml.styl')

class PageHtmlContainer extends React.Component {
  handleClickBtnClose = () => this.props.dispatch(setActiveFileContentHide())

  render () {
    const { activeFileContent, app: { PageHtml } } = this.props

    return (
      <PopinFixed customClass={`${PageHtml.customClass}`}>
        <PopinFixedHeader
          customClass={`${PageHtml.customClass}`}
          icon={PageHtml.icon}
          name={activeFileContent.title}
          onClickCloseBtn={this.handleClickBtnClose}
        />

        <PopinFixedOption customClass={`${PageHtml.customClass}`} />

        <PopinFixedContent customClass={`${PageHtml.customClass}__contentpage`}>
          <PageHtmlComponent
            version={activeFileContent.version}
            text={activeFileContent.text}
            key={'PageHtml'}
          />

          <Timeline
            customClass={`${PageHtml.customClass}__contentpage`}
            key={'pageHtml__timeline'}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

const mapStateToProps = ({ activeFileContent, app }) => ({ activeFileContent, app })
export default connect(mapStateToProps)(PageHtmlContainer)
