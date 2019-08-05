import React from 'react'
import { withTranslation } from 'react-i18next'
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
const ACTION_EDIT = 'edit'

class CollaborativeEditionFrame extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      iframeUrl: '',
      formId: props.formId ? props.formId : FORM_ID,
      iframeId: props.frameId ? props.frameId : IFRAME_ID,
      iframeStyle: {
        width: '100%',
        height: '100%',
        top: 61,
        left: 0,
        position: 'fixed',
        zIndex: 100,
        ...props.iframeStyle
      },
      accessToken: '',
      onlineEditorUrl: '',
      ready: false
    }
  }

  buildCompleteIframeUrl = (urlSource, accessToken) => {
    const { state } = this
    const protocol = window.location.protocol
    // INFO - B.L - 2019.08.01 - We assume frontend is on the same host than the API
    const host = window.location.host
    return `${urlSource}WOPISrc=${protocol}//${host}${PAGE.ONLINE_EDITION(state.content.content_id)}&access_token=${accessToken}&closebutton=1`
  }

  handleIframeIsClosing = (event) => {
    if (JSON.parse(event.data).MessageId === 'close') {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.OPEN_CONTENT_URL,
        data: {
          workspaceId: this.props.content.workspace_id,
          contentType: this.state.content.content_type,
          contentId: this.props.content.content_id
        }
      })
    }
  }

  showIframe = () => {
    if (this.state.ready) {
      document.getElementById(this.state.formId).submit()
    }
  }

  async componentDidMount () {
    console.log('%c<CollaboraFrame> did mount', `color: ${this.props.config.hexcolor}`)
    await this.loadContent()
    await this.setIframeConfig()
    this.showIframe()
    window.addEventListener('message', this.handleIframeIsClosing, false)
  }

  componentWillUnmount () {
    console.log('%c<CollaboraFrame> will Unmount', `color: ${this.props.config.hexcolor}`)
    document.removeEventListener('message', this.handleIframeIsClosing)
  }

  loadContent = async () => {
    const fetchResultFile = await handleFetchResult(
      await getFileContent(this.props.config.apiUrl, this.props.content.workspace_id, this.props.content.content_id)
    )
    switch (fetchResultFile.apiResponse.status) {
      case 200:
        this.setState({
          content: {
            ...fetchResultFile.body
          }
        })
        break
      default:
        this.sendGlobalFlashMessage(this.props.t('Error while loading file'))
    }
  }

  setIframeConfig = async () => {
    const { state, props } = this
    if (!state.content.file_extension) {
      return
    }
    if (!props.config.system.config.collaborative_document_edition) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.OPEN_CONTENT_URL,
        data: {
          workspaceId: props.content.workspace_id,
          contentType: state.content.content_type,
          contentId: props.content.content_id
        }
      })
      return
    }
    const softwareFileType = props.config.system.config.collaborative_document_edition.supported_file_types.find(
      (type) => type.extension === state.content.file_extension.substr(1) && type.associated_action === ACTION_EDIT
    )

    if (!softwareFileType) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.OPEN_CONTENT_URL,
        data: {
          workspaceId: props.content.workspace_id,
          contentType: state.content.content_type,
          contentId: props.content.content_id
        }
      })
      return
    }

    const response = await handleFetchResult(
      await getWOPIToken(props.config.apiUrl)
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

export default withTranslation()(CollaborativeEditionFrame)
