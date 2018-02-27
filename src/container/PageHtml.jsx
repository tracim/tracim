import React from 'react'
import PageHtmlComponent from '../component/PageHtml.jsx'
import {
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent
} from 'tracim_lib'

class pageHtml extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      pluginName: 'PageHtml',
      data: props.data
        ? props.data
        : { // for debugg purpose
          PageHtml: {
            name: 'PageHtml',
            componentLeft: 'PageHtml',
            componentRight: 'Timeline',
            customClass: 'wsFilePageHtml',
            icon: 'fa fa-file-word-o'
          },
          activeFileContent: {
            version: '3',
            text: 'Bonjour ?'
          }
        }
    }

    document.addEventListener('pluginCustomEvent', this.customEventReducer, false)
  }

  customEventReducer = ({detail}) => {
    switch (detail.type) {
      case 'PageHtml_showMsg':
        this.setState({inputText: detail.content})
        break
    }
  }

  handleClickBtnClosePlugin = () => {
    GLOBAL_unmountPlugin(this.state.pluginName)
  }

  render () {
    const { PageHtml, activeFileContent } = this.state.data

    return (
      <PopinFixed customClass={`${PageHtml.customClass}`}>
        <PopinFixedHeader
          customClass={`${PageHtml.customClass}`}
          icon={PageHtml.icon}
          name={activeFileContent.title}
          onClickCloseBtn={this.handleClickBtnClosePlugin}
        />

        <PopinFixedOption customClass={`${PageHtml.customClass}`} />

        <PopinFixedContent customClass={`${PageHtml.customClass}__contentpage`}>
          <PageHtmlComponent
            version={activeFileContent.version}
            text={activeFileContent.text}
            key={'PageHtml'}
          />

          <div>Timeline</div>

          {/*
          <Timeline
            customClass={`${PageHtml.customClass}__contentpage`}
            key={'pageHtml__timeline'}
          />
          */}
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default pageHtml
