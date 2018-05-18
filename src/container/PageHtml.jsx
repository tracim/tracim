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
import { FETCH_CONFIG, MODE } from '../helper.js'
import i18n from '../i18n.js'

const debug = {
  config: {
    name: 'PageHtml',
    label: {
      fr: 'Page Html',
      en: 'Html page'
    },
    componentLeft: 'PageHtml',
    componentRight: 'Timeline',
    customClass: 'wsContentPageHtml',
    icon: 'fa fa-file-text-o',
    color: '#fdfdfd',
    domContainer: 'appContainer',
    mockApiUrl: 'http://localhost:3001'
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
    version: 'version n°1',
    text: 'This is the default pageHtml content for debug purpose',
    workspace: {
      id: -1,
      title: 'Test debug workspace',
      ownerId: 5
    }
  },
  timeline: timelineDebugData
}

class pageHtml extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'PageHtml',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      timeline: props.data ? [] : debug.timeline,
      mode: MODE.VIEW
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: action }) => { // action: { type: '', data: {} }
    switch (action.type) {
      case 'PageHtml_showApp':
        this.setState({isVisible: true})
        break
      case 'PageHtml_hideApp':
        this.setState({isVisible: false})
        break
    }
  }

  async componentDidMount () {
    const { content, config } = this.state
    if (content.id === '-1') return // debug case

    const fetchResultPageHtml = await fetch(`${config.mockApiUrl}/workspace/${content.workspace.id}/content/${content.id}`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })
    const fetchResultTimeline = await fetch(`${config.mockApiUrl}/workspace/${content.workspace.id}/content/${content.id}/timeline`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })

    fetchResultPageHtml.json = await handleFetchResult(fetchResultPageHtml)
    fetchResultTimeline.json = await handleFetchResult(fetchResultTimeline)

    this.setState({
      content: fetchResultPageHtml.json,
      timeline: fetchResultTimeline.json
    })

    // wysiwyg()
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
  }

  handleChangeTitle = e => console.log('new title : ', e.target.value)

  handleClickNewVersion = () => {
    this.setState({ mode: MODE.EDIT })
  }

  handleCloseNewVersion = () => {
    this.setState({ mode: MODE.VIEW })
  }

  render () {
    const { isVisible, loggedUser, content, timeline, config } = this.state

    if (!isVisible) return null

    return (
      <PopinFixed customClass={`${config.customClass}`}>
        <PopinFixedHeader
          customClass={`${config.customClass}`}
          icon={config.icon}
          name={content.title}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onChangeTitle={this.handleChangeTitle}
        />

        <PopinFixedOption
          customClass={`${config.customClass}`}
          onClickNewVersionBtn={this.handleClickNewVersion}
          i18n={i18n}
        />

        <PopinFixedContent customClass={`${config.customClass}__contentpage`}>
          <PageHtmlComponent
            mode={this.state.mode}
            onClickCloseEditMode={this.handleCloseNewVersion}
            version={content.version}
            text={content.text}
            key={'PageHtml'}
          />

          <Timeline
            customClass={`${config.customClass}__contentpage`}
            loggedUser={loggedUser}
            timelineData={timeline}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default pageHtml
