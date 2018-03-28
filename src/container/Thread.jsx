import React from 'react'
import ThreadComponent from '../component/Thread.jsx'
import {
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent
} from 'tracim_lib'
import { listMessageDebugData } from '../listMessageDebugData.js'
import { FETCH_CONFIG } from '../helper.js'
import i18n from '../i18n.js'

const debug = {
  config: {
    name: 'Thread',
    label: {
      fr: 'Discussion',
      en: 'Thread'
    },
    componentLeft: 'Thread',
    componentRight: 'undefined',
    customClass: 'wsContentThread',
    icon: 'fa fa-comments-o',
    color: '#65c7f2',
    domContainer: 'appContainer',
    apiUrl: 'http://localhost:3001'
  },
  loggedUser: {
    id: 5,
    username: 'Stoi',
    firstname: 'John',
    lastname: 'Doe',
    email: 'osef@algoo.fr',
    avatar: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4'
  },
  content: {
    id: 2,
    type: 'thread',
    status: 'validated',
    title: 'test debug title',
    workspace: {
      id: 1,
      title: 'Test debug workspace',
      ownerId: 5
    }
  },
  listMessage: listMessageDebugData
}

class Thread extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'Thread',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      listMessage: props.data ? [] : debug.listMessage
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: action }) => { // action: { type: '', data: {} }
    switch (action.type) {
      case 'Thread_showApp':
        this.setState({isVisible: true})
        break
      case 'Thread_hideApp':
        this.setState({isVisible: false})
        break
    }
  }

  async componentDidMount () {
    const { content, config } = this.state
    if (content.id === '-1') return // debug case

    const fetchResultThread = await fetch(`${config.apiUrl}/workspace/${content.workspace.id}/content/${content.id}`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })

    fetchResultThread.json = await handleFetchResult(fetchResultThread)

    this.setState({
      content: {
        id: fetchResultThread.json.id,
        status: fetchResultThread.json.status,
        title: fetchResultThread.json.title,
        type: fetchResultThread.json.type
      },
      listMessage: fetchResultThread.json.message_list
    })
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
  }

  render () {
    const { isVisible, loggedUser, content, listMessage, config } = this.state

    if (!isVisible) return null

    return (
      <PopinFixed customClass={`${config.customClass}`}>
        <PopinFixedHeader
          customClass={`${config.customClass}`}
          icon={config.icon}
          name={content.title}
          onClickCloseBtn={this.handleClickBtnCloseApp}
        />

        <PopinFixedOption customClass={`${config.customClass}`} i18n={i18n} />

        <PopinFixedContent customClass={`${config.customClass}__contentpage`}>
          <ThreadComponent
            title={content.title}
            listMessage={listMessage}
            loggedUser={loggedUser}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default Thread
