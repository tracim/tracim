import React from 'react'
import PageHtmlComponent from '../component/PageHtml.jsx'
import {
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline
} from 'tracim_lib'
import { timelineDebugData } from '../timelineDebugData.js'
import { FETCH_CONFIG } from '../helper.js'

const debug = {
  workspace: {
    id: -1,
    title: 'Test debug workspace'
  },
  appConfig: {
    name: 'PageHtml',
    customClass: 'wsFilePageHtml',
    icon: 'fa fa-file-word-o',
    apiUrl: 'http://localhost:3001'
  },
  loggedUser: {
    id: 5,
    username: 'Smoi',
    firstname: 'Côme',
    lastname: 'Stoilenom',
    email: 'osef@algoo.fr',
    avatar: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4'
  },
  content: {
    id: -1,
    type: 'pageHtml',
    title: 'Test debug pageHtml',
    status: 'validated',
    version: '-1',
    text: 'This is the default pageHtml content for debug purpose'
  },
  timeline: timelineDebugData
}

class pageHtml extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'PageHtml',
      isVisible: true,
      workspace: props.app ? props.app.workspace : debug.workspace,
      appConfig: props.app ? props.app.appConfig : debug.appConfig,
      loggedUser: props.app ? props.app.loggedUser : debug.loggedUser,
      content: props.app ? props.app.content : debug.content,
      timeline: props.app ? [] : debug.timeline
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  async componentDidMount () {
    const { workspace, content, appConfig } = this.state
    if (content.id === '-1') return // debug case

    const fetchResultPageHtml = await fetch(`${appConfig.apiUrl}/workspace/${workspace.id}/content/${content.id}`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })
    const fetchResultTimeline = await fetch(`${appConfig.apiUrl}/workspace/${workspace.id}/content/${content.id}/timeline`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })

    fetchResultPageHtml.json = await handleFetchResult(fetchResultPageHtml)
    fetchResultTimeline.json = await handleFetchResult(fetchResultTimeline)

    this.setState({
      content: fetchResultPageHtml.json,
      timeline: fetchResultTimeline.json
    })
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
    const { isVisible, loggedUser, content, timeline, appConfig } = this.state

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
            loggedUser={loggedUser}
            timelineData={timeline}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default pageHtml
