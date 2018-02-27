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
          file: {
            version: '3',
            text: 'Bonjour ?'
          },
          pluginData: {
            name: 'PageHtml',
            componentLeft: 'PageHtml',
            componentRight: 'Timeline',
            customClass: 'wsFilePageHtml',
            icon: 'fa fa-file-word-o'
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
    const { file, pluginData } = this.state.data

    return (
      <PopinFixed customClass={`${pluginData.customClass}`}>
        <PopinFixedHeader
          customClass={`${pluginData.customClass}`}
          icon={pluginData.icon}
          name={file.title}
          onClickCloseBtn={this.handleClickBtnClosePlugin}
        />

        <PopinFixedOption customClass={`${pluginData.customClass}`} />

        <PopinFixedContent customClass={`${pluginData.customClass}__contentpage`}>
          <PageHtmlComponent
            version={file.version}
            text={file.text}
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
