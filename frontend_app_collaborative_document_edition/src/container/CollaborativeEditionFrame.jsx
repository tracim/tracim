import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  handleFetchResult,
  CUSTOM_EVENT,
  addAllResourceI18n,
  buildHeadTitle,
  getFileContent,
  getWorkspaceDetail,
  sendGlobalFlashMessage,
  PAGE,
  ROLE
} from 'tracim_frontend_lib'
import { getWOPIToken } from '../action.async.js'

const FORM_ID = 'loleafletform'
const IFRAME_ID = 'loleafletframe'

export class CollaborativeEditionFrame extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      config: props.data ? props.data.config : {},
      loggedUser: props.data ? props.data.loggedUser : {},
      content: props.data ? props.data.content : {},
      iframeUrl: '',
      formId: props.formId ? props.formId : FORM_ID,
      iframeId: props.frameId ? props.frameId : IFRAME_ID,
      iframeStyle: {
        width: '100%',
        height: 'calc(100% - 60px)',
        top: 61,
        left: 0,
        position: 'fixed',
        zIndex: 25,
        border: 'none',
        ...props.iframeStyle
      },
      accessToken: '',
      onlineEditorUrl: '',
      ready: false
    }
    // INFO - B.L - 2019/09/03 handleIframeIsClosing is called by an event from window so we have to bind this
    this.handleIframeIsClosing = this.handleIframeIsClosing.bind(this)
    addAllResourceI18n(i18n, props.data.config.translation, props.data.loggedUser.lang)
    i18n.changeLanguage(props.data.loggedUser.lang)
  }

  async componentDidMount () {
    // console.log('%c<CollaboraFrame> did mount', `color: ${props.data.config.hexcolor}`, props)
    // INFO - B.L - 2019/09/03 Collabora fire the event from window we need to listen window.
    window.addEventListener('message', this.handleIframeIsClosing)
    try {
      await this.loadContent()
    } catch (error) {
      console.log(error.message)
      return
    }

    await this.setIframeConfig()
    this.showIframe()
  }

  componentWillUnmount () {
    console.log('%c<CollaboraFrame> will Unmount', `color: ${this.props.data.config.hexcolor}`)
    window.removeEventListener('message', this.handleIframeIsClosing)
  }

  setHeadTitle = async (contentName, workspaceLabel) => {
    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.SET_HEAD_TITLE,
      data: { title: buildHeadTitle([contentName, workspaceLabel]) }
    })
  }

  handleIframeIsClosing (event) {
    const { props, state } = this
    let data = {}
    // INFO - B.L - 2019.08.12 - if might catch event producing utf-8 error while parsing
    try {
      data = JSON.parse(event.data)
    } catch (error) {
      data = {}
    }
    if (data.MessageId && data.MessageId === 'close') {
      this.redirectTo(props.data.content.workspace_id, state.content.content_type, props.data.content.content_id)
    }
  }

  showIframe = () => {
    if (this.state.ready) {
      document.getElementById(this.state.formId).submit()
    }
  }

  buildCompleteIframeUrl = (urlSource, accessToken) => {
    const { state } = this
    const protocol = window.location.protocol
    const readyonly = !state.content.is_editable || !(state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id)
    // INFO - B.L - 2019.08.01 - We assume frontend is on the same host than the API
    const host = window.location.host
    let url = `${urlSource}WOPISrc=${protocol}//${host}${PAGE.ONLINE_EDITION(state.content.content_id)}&access_token=${accessToken}&closebutton=1&lang=${state.loggedUser.lang}`
    if (readyonly) {
      url += '&permission=readonly'
    }
    return url
  }

  loadContent = async () => {
    const { props } = this
    const requestContent = getFileContent(props.data.config.apiUrl, props.data.content.workspace_id, props.data.content.content_id)
    const requestWorkspace = getWorkspaceDetail(props.data.config.apiUrl, props.data.content.workspace_id)

    const [requestContentUnHandled, requestWorkspaceUnHandled] = await Promise.all([requestContent, requestWorkspace])

    const [responseContent, responseWorkspace] = await Promise.all([
      handleFetchResult(requestContentUnHandled),
      handleFetchResult(requestWorkspaceUnHandled)
    ])

    switch (responseContent.apiResponse.status) {
      case 200:
        this.setState({ content: { ...responseContent.body } })
        if (responseWorkspace.apiResponse.status === 200) this.setHeadTitle(responseContent.body.label, responseWorkspace.body.label)
        break
      case 400:
        switch (responseContent.body.code) {
          // INFO - B.L - 2019.08.06 - content id does not exists in db
          case 1003:
          // INFO - B.L - 2019.08.06 - content id is not a valid integer
          case 2023: // eslint-disable-line no-fallthrough
            sendGlobalFlashMessage(props.t('Content not found'))
            this.redirectTo(props.data.content.workspace_id)
            throw new Error(responseContent.body.message)
          // INFO - B.L - 2019.08.06 - workspace does not exists or forbidden
          case 1002:
          // INFO - B.L - 2019.08.06 - workspace id is not a valid integer
          case 2022: // eslint-disable-line no-fallthrough
            sendGlobalFlashMessage(props.t('Space not found'))
            this.redirectTo()
            throw new Error(responseContent.body.message)
        }
        break
      default:
        sendGlobalFlashMessage(props.t('Unknown error'))
        this.redirectTo()
        throw new Error('Unknown error')
    }
  }

  setIframeConfig = async () => {
    const { state, props } = this
    if (!state.content.file_extension) {
      return
    }
    if (!props.data.config.system.config.collaborative_document_edition) {
      sendGlobalFlashMessage(props.t('Unknown url'))
      this.redirectTo(props.data.content.workspace_id, state.content.content_type, props.data.content.content_id)
      return
    }
    const softwareFileType = props.data.config.system.config.collaborative_document_edition.supported_file_types.find(
      (type) => type.extension === state.content.file_extension.substr(1)
    )

    if (!softwareFileType) {
      sendGlobalFlashMessage(props.t('You cannot edit this type of file online'))
      this.redirectTo(props.data.content.workspace_id, state.content.content_type, props.data.content.content_id)
      return
    }

    const response = await handleFetchResult(
      await getWOPIToken(props.data.config.apiUrl)
    )
    switch (response.apiResponse.status) {
      case 200:
        this.setState({
          accessToken: response.body.access_token,
          onlineEditorUrl: softwareFileType.url_source,
          iframeUrl: this.buildCompleteIframeUrl(softwareFileType.url_source, response.body.access_token),
          ready: true
        })
        break
      default:
        console.log('Error while loading token')
        break
    }
  }

  redirectTo = (workspaceId, contentType, contentId) => {
    let url = '/ui'
    if (workspaceId) {
      url += `/workspaces/${workspaceId}/contents`
    }
    if (workspaceId && contentId) {
      url += `/${contentType}/${contentId}`
    }
    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.REDIRECT,
      data: { url: url }
    })
  }

  render () {
    return (
      <div>
        <form id={this.state.formId} name={this.state.formId} target={this.state.iframeId} action={this.state.iframeUrl} method='post'>
          <input name='access_token' value={this.state.accessToken} type='hidden' />
        </form>
        <iframe id={this.state.iframeId} name={this.state.iframeId} allowFullScreen style={this.state.iframeStyle} />
      </div>
    )
  }
}

export default translate()(CollaborativeEditionFrame)
