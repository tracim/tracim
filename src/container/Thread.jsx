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

const debug = {
  loggedUser: {
    id: 5,
    username: 'Stoi',
    firstname: 'John',
    lastname: 'Doe',
    email: 'osef@algoo.fr',
    avatar: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4'
  },
  workspace: {
    id: 1,
    title: 'Test debug workspace'
  },
  content: {
    id: 2,
    type: 'thread',
    status: 'validated',
    title: 'test debug title'
  },
  listMessage: listMessageDebugData,
  appConfig: {
    name: 'Thread',
    customClass: 'wsContentThread',
    icon: 'fa fa-comments-o',
    apiUrl: 'http://localhost:3001'
  }
}

class Thread extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'Thread',
      isVisible: true,
      loggedUser: props.app ? props.app.loggedUser : debug.loggedUser,
      workspace: props.app ? props.app.workspace : debug.workspace,
      content: props.app ? props.app.content : debug.content,
      listMessage: props.app ? props.app.content.message_list : debug.listMessage,
      appConfig: props.app ? props.app.appConfig : debug.appConfig
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  async componentDidMount () {
    const { workspace, content, appConfig } = this.state
    if (content.id === '-1') return // debug case

    const fetchResultThread = await fetch(`${appConfig.apiUrl}/workspace/${workspace.id}/content/${content.id}`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })

    fetchResultThread.json = await handleFetchResult(fetchResultThread)

    this.setState({
      content: fetchResultThread.json
    })
  }

  customEventReducer = ({detail}) => {
    switch (detail.type) {
      case 'Thread_showMsg': // unused for now, for testing purpose
        this.setState({inputText: detail.content})
        break
    }
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
  }

  render () {
    const { isVisible, loggedUser, content, listMessage, appConfig } = this.state

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
