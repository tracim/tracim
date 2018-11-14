import React from 'react'
import AppFolderComponent from '../component/AppFolder.jsx'
import {
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
    name: 'appFolder',
    label: {
      fr: 'Page Html',
      en: 'Html page'
    },
    componentLeft: 'appFolder',
    componentRight: 'Timeline',
    customClass: 'wsContentappfolder',
    icon: 'fa fa-file-text-o',
    color: '#fdfdfd',
    domContainer: 'appContainer',
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
    type: 'appFolder',
    title: 'Test debug appFolder',
    status: 'validated',
    version: 'version n°1',
    text: 'This is the default appFolder content for debug purpose',
    workspace: {
      id: -1,
      title: 'Test debug workspace',
      ownerId: 5
    }
  },
  timeline: timelineDebugData
}

class AppFolder extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'appFolder',
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
      case 'appFolder_showApp':
        this.setState({isVisible: true})
        break
      case 'appFolder_hideApp':
        this.setState({isVisible: false})
        break
    }
  }

  async componentDidMount () {
    const { content, config } = this.state
    if (content.id === '-1') return // debug case

    const fetchResultappFolder = await fetch(`${config.apiUrl}/workspace/${content.workspace.id}/content/${content.id}`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })
    const fetchResultTimeline = await fetch(`${config.apiUrl}/workspace/${content.workspace.id}/content/${content.id}/timeline`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })

    fetchResultappFolder.json = await handleFetchResult(fetchResultappFolder)
    fetchResultTimeline.json = await handleFetchResult(fetchResultTimeline)

    this.setState({
      content: fetchResultappFolder.json,
      timeline: fetchResultTimeline.json
    })

    wysiwyg()
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
  }

  handleChangeTitle = e => console.log('new title : ', e.target.value)

  render () {
    const { isVisible, loggedUser, content, timeline, config } = this.state

    return (
      <PopinFixed customClass='appfolder'>
        <PopinFixedHeader
          customClass='appFolder'
          icon='fa fa-fw fa-folder-o'
          name='title of the header'
          onClickCloseBtn={() => {}}
        />

        <PopinFixedOption customClass='appfolder__option' i18n={i18n} />

        <PopinFixedContent customClass='appfolder'>

          <AppFolderComponent
            mode={this.state.mode}
            onClickCloseNewVersion={this.handleCloseNewVersion}
            version={content.version}
            text={content.text}
            key={'AppFolder'}
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

export default AppFolder
