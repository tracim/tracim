import React from 'react'
import PageHtmlComponent from '../component/PageHtml.jsx'
import {
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline
} from 'tracim_lib'
import { FETCH_CONFIG } from '../helper.js'

const debug = {
  workspace: {
    id: '-1',
    title: 'Test debugg workspace'
  },
  content: {
    id: '-1',
    type: 'pageHtml',
    title: 'Test debugg pageHtml',
    status: 'validated',
    version: '-1',
    text: 'This is the default pageHtml content for debug purpose'
  },
  appConfig: {
    name: 'PageHtml',
    customClass: 'wsFilePageHtml',
    icon: 'fa fa-file-word-o',
    apiUrl: 'http://localhost:3001'
  }
}

class pageHtml extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'PageHtml',
      isVisible: true,
      workspace: props.app ? props.app.workspace : debug.workspace,
      content: props.app ? props.app.content : debug.content,
      appConfig: props.app ? props.app.appConfig : debug.appConfig
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  async componentDidMount () {
    const { workspace, content, appConfig } = this.state
    if (content.id === '-1') return

    const fetchResult = await fetch(`${appConfig.apiUrl}/workspace/${workspace.id}/content/${content.id}`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })

    fetchResult.json = await (async () => {
      switch (fetchResult.status) {
        case 200:
        case 304:
          return fetchResult.json()
        case 204:
        case 400:
        case 404:
        case 409:
        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
          return `Error: ${fetchResult.status}` // @TODO : handle errors from api result
      }
    })()

    this.setState({content: fetchResult.json})
  }

  customEventReducer = action => { // action: { type: '', data: {} }
    switch (action.type) {
      case 'PageHtml_dummyTest':
        this.setState({dummy: true})
        break
    }
  }

  handleClickBtnCloseApp = () => {
    // GLOBAL_unmountApp(this.state.appName)
    this.setState({ isVisible: false })
  }

  render () {
    const { isVisible, content, appConfig } = this.state

    if (!isVisible) return null

    return (
      <PopinFixed customClass={`${appConfig.customClass}`}>
        <PopinFixedHeader
          customClass={`${appConfig.customClass}`}
          icon={appConfig.icon}
          name={content.title}
          onClickCloseBtn={this.handleClickBtnCloseApp}
        />

        <PopinFixedOption customClass={`${appConfig.customClass}`} />

        <PopinFixedContent customClass={`${appConfig.customClass}__contentpage`}>
          <PageHtmlComponent
            version={content.version}
            text={content.text}
            key={'PageHtml'}
          />

          <Timeline
            customClass={`${appConfig.customClass}__contentpage`}
            key={'pageHtml__timeline'}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default pageHtml
