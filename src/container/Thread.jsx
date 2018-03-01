import React from 'react'
import ThreadComponent from '../component/Thread.jsx'
import {
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline
} from 'tracim_lib'

class pageHtml extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'Thread',
      data: props.data
        ? props.data
        : { // for debugg purpose
          file: {
            version: '3',
            text: 'Bonjour ?'
          },
          appData: {
            name: 'Thread',
            componentLeft: 'Thread',
            componentRight: undefined,
            customClass: 'wsFileThread',
            icon: 'fa fa-comments-o'
          }
        }
    }

    document.addEventListener('appCustomEvent', this.customEventReducer, false)
  }

  customEventReducer = ({detail}) => {
    switch (detail.type) {
      case 'Thread_showMsg': // unused for now, for testing purpose
        this.setState({inputText: detail.content})
        break
    }
  }

  handleClickBtnCloseApp = () => {
    GLOBAL_unmountApp(this.state.appName)
  }

  render () {
    const { file, appData } = this.state.data

    return (
      <PopinFixed customClass={`${appData.customClass}`}>
        <PopinFixedHeader
          customClass={`${appData.customClass}`}
          icon={appData.icon}
          name={file.title}
          onClickCloseBtn={this.handleClickBtnCloseApp}
        />

        <PopinFixedOption customClass={`${appData.customClass}`} />

        <PopinFixedContent customClass={`${appData.customClass}__contentpage`}>
          <ThreadComponent
            // version={file.version}
            // text={file.text}
            key={'PageHtml'}
          />

          <Timeline
            customClass={`${appData.customClass}__contentpage`}
            key={'pageHtml__timeline'}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default pageHtml
