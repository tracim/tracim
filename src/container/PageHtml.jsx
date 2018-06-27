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
    label: 'Text Document',
    slug: 'page',
    faIcon: 'file-text-o',
    hexcolor: '#3f52e3',
    creationLabel: 'Write a document',
    domContainer: 'appContainer',
    apiUrl: 'localhost:6543/api/v2',
    mockApiUrl: 'localhost:3001',
    apiHeader: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
      // 'Authorization': 'Basic ' + btoa(`${'admin@admin.admin'}:${'admin@admin.admin'}`)
    }
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
    author: {
      avatar_url: null,
      public_name: 'Global manager',
      user_id: 1
    },
    content_id: -1,
    content_type: 'page',
    created: '2018-06-18T14:59:26Z',
    current_revision_id: 11,
    is_archived: false,
    is_deleted: false,
    label: 'Current Menu',
    last_modifier: {
      avatar_url: null,
      public_name: 'Global manager',
      user_id: 1
    },
    modified: '2018-06-18T14:59:26Z',
    parent_id: 2,
    raw_content: '<div>bonjour, je suis un lapin.</div>',
    show_in_ui: true,
    slug: 'current-menu',
    status: 'open',
    sub_content_types: ['thread', 'page', 'file', 'folder'],
    workspace_id: 1
  },
  timeline: timelineDebugData
}

class pageHtml extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'page',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      timeline: props.data ? [] : debug.timeline,
      mode: MODE.VIEW
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'page_showApp':
        this.setState({isVisible: true})
        break
      case 'page_hideApp':
        this.setState({isVisible: false})
        break
      case 'page_reloadContent':
        this.setState({content: data})
    }
  }

  componentDidMount () {
    console.log('pageHtml did mount')
    if (this.state.content.content_id === -1) return // debug case

    this.loadContent()
    // wysiwyg()
  }

  componentDidUpdate (prevProps, prevState) {
    console.log('pageHtml did update', prevState, this.state)
    if (!prevState.content || !this.state.content) return

    if (prevState.content.content_id !== this.state.content.content_id) {
      this.loadContent()
    }
  }

  loadContent = async () => {
    console.log('loadContent')
    const { content, config } = this.state

    const fetchResultPageHtml = await fetch(`${config.apiUrl}/workspaces/${content.workspace_id}/html-documents/${content.content_id}`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })
    const fetchResultTimeline = await fetch(`${config.apiUrl}/workspaces/${content.workspace_id}/contents/${content.content_id}/comments`, {
      ...FETCH_CONFIG,
      method: 'GET'
    })

    // Promise.all([
    //   handleFetchResult(fetchResultPageHtml),
    //   handleFetchResult(fetchResultTimeline)
    // ])
    //   .then(([resPageHtml, resTimeline]) => {
    //     this.setState({
    //       content: resPageHtml,
    //       timeline: resTimeline
    //     })
    //   })
    handleFetchResult(fetchResultPageHtml)
      .then(resPageHtml => this.setState({content: resPageHtml}))
      .catch(e => console.log('Error loading content.', e))

    handleFetchResult(fetchResultTimeline)
      .then(resTimeline => this.setState({timeline: resTimeline}))
      .catch(e => {
        console.log('Error loading Timeline.', e)
        this.setState({timeline: []})
      })
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({type: 'appClosed', data: {}})
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
      <PopinFixed customClass={`${config.slug}`}>
        <PopinFixedHeader
          customClass={`${config.slug}`}
          icon={config.faIcon}
          name={content.label}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onChangeTitle={this.handleChangeTitle}
        />

        <PopinFixedOption
          customClass={`${config.slug}`}
          onClickNewVersionBtn={this.handleClickNewVersion}
          i18n={i18n}
        />

        <PopinFixedContent customClass={`${config.slug}__contentpage`}>
          <PageHtmlComponent
            mode={this.state.mode}
            onClickCloseEditMode={this.handleCloseNewVersion}
            version={content.current_revision_id}
            text={content.raw_content}
            key={'html-documents'}
          />

          <Timeline
            customClass={`${config.slug}__contentpage`}
            loggedUser={loggedUser}
            timelineData={timeline}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default pageHtml
