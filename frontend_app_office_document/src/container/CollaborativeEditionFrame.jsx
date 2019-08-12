import React from 'react'
import { translate } from 'react-i18next'
import { PAGE } from '../helper.js'
import {
  handleFetchResult,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import {
  getWOPIToken,
  getFileContent
} from '../action.async.js'

const FORM_ID = 'loleafletform'
const IFRAME_ID = 'loleafletframe'

class CollaborativeEditionFrame extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      iframeUrl: '',
      formId: props.formId ? props.formId : FORM_ID,
      iframeId: props.frameId ? props.frameId : IFRAME_ID,
      iframeStyle: {
        width: '100%',
        height: 'calc(100% - 61px)',
        top: 61,
        left: 0,
        position: 'fixed',
        zIndex: 25,
        ...props.iframeStyle
      },
      accessToken: '',
      onlineEditorUrl: '',
      ready: false,
      loggedUser: props.data.loggedUser
    }
  }

  async componentDidMount () {
    const { props } = this
    console.log('%c<CollaboraFrame> did mount', `color: ${this.props.data.config.hexcolor}`, props)
    try {
      await this.loadContent()
    } catch (error) {
      console.log(error.message)
      return
    }

    await this.setIframeConfig()
    this.showIframe()
    window.addEventListener('message', this.handleIframeIsClosing, false)
  }

  componentWillUnmount () {
    console.log('%c<CollaboraFrame> will Unmount', `color: ${this.props.data.config.hexcolor}`)
    document.removeEventListener('message', this.handleIframeIsClosing)
  }

  handleIframeIsClosing = (event) => {
    const { props, state } = this
    if (JSON.parse(event.data).MessageId === 'close') {
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
    const readyonly = !state.content.is_editable || state.loggedUser.userRoleIdInWorkspace >= 2
    // INFO - B.L - 2019.08.01 - We assume frontend is on the same host than the API
    const host = window.location.host
    let url = `${urlSource}WOPISrc=${protocol}//${host}${PAGE.ONLINE_EDITION(state.content.content_id)}&access_token=${accessToken}&closebutton=1`
    if (readyonly) {
      url += '&permission=readonly'
    }
    return url
  }

  loadContent = async () => {
    const { props } = this
    const request = await getFileContent(props.data.config.apiUrl, props.data.content.workspace_id, props.data.content.content_id)
    const response = await handleFetchResult(request)
    switch (response.apiResponse.status) {
      case 200:
        this.setState({
          content: {
            ...response.body
          }
        })
        break
      case 400:
        switch (response.body.code) {
          // INFO - B.L - 2019.08.06 - content id does not exists in db
          case 1003:
          // INFO - B.L - 2019.08.06 - content id is not a valid integer
          case 2023: // eslint-disable-line no-fallthrough
            this.sendGlobalFlashMessage(props.t('Content not found'))
            this.redirectTo(props.data.content.workspace_id)
            throw new Error(response.body.message)
          // INFO - B.L - 2019.08.06 - workspace does not exists or forbidden
          case 1002:
          // INFO - B.L - 2019.08.06 - workspace id is not a valid integer
          case 2022: // eslint-disable-line no-fallthrough
            this.sendGlobalFlashMessage(props.t('Workspace not found'))
            this.redirectTo()
            throw new Error(response.body.message)
        }
        break
      default:
        this.sendGlobalFlashMessage(props.t('Unknown error'))
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
      this.sendGlobalFlashMessage(props.t('Unknown url'))
      this.redirectTo(props.data.content.workspace_id, state.content.content_type, props.data.content.content_id)
      return
    }
    const softwareFileType = props.data.config.system.config.collaborative_document_edition.supported_file_types.find(
      (type) => type.extension === state.content.file_extension.substr(1)
    )

    if (!softwareFileType) {
      this.sendGlobalFlashMessage(props.t('You cannot edit this type of file online'))
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

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

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
      data: {
        url: url
      }
    })
  }

  render () {
    return (
      <div>
        <form id={this.state.formId} name={this.state.formId} target={this.state.iframeId} action={this.state.iframeUrl} method='post'>
          <input name='access_token' value={this.state.accessToken} type='hidden' />
        </form>
        <iframe id={this.state.iframeId} name={this.state.iframeId} allowfullscreen style={this.state.iframeStyle} />
      </div>
    )
  }
}

export default translate()(CollaborativeEditionFrame)
