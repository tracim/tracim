import React from 'react'
import { translate } from 'react-i18next'
import { PAGE } from '../helper.js'
import {
  handleFetchResult
} from 'tracim_frontend_lib'
import {
  getWOPIDiscovery,
  getFileContent
} from '../action.async.js'

const FORM_ID = 'loleafletform'
const IFRAME_ID = 'loleafletframe'
const CONTENT_TYPE_FILE = 'file'

class CollaboraFrame extends React.Component {
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
      content: props.content
    }
  }

  buildCompleteIframeUrl = (iframeUrl) => {
    return `${iframeUrl}&closebutton=1`
  }

  handleIframeIsClosing = (event) => {
    if (JSON.parse(event.data).MessageId === 'close') {
      console.log('TEST')
      console.log(this.state.content.workspace_id)
      console.log(CONTENT_TYPE_FILE)
      console.log(this.state.content.content_id)
      console.log(PAGE.WORKSPACE.CONTENT(this.state.content.workspace_id, CONTENT_TYPE_FILE, this.state.content.content_id))
      this.props.history.push(
        PAGE.WORKSPACE.CONTENT(this.state.content.workspace_id, CONTENT_TYPE_FILE, this.state.content.content_id)
      )
    }
  }

  showIframe = () => {
    document.getElementById(this.state.formId).submit()
  }

  async componentDidMount () {
    console.log('%c<CollaboraFrame> did mount', `color: ${this.props.config.hexcolor}`)
    await this.loadContent()
    await this.setIframeConf()
    this.showIframe()
    window.addEventListener('message', this.handleIframeIsClosing, false)
  }

  componentWillUnmount () {
    console.log('%c<File> will Unmount', `color: ${this.props.config.hexcolor}`)
    document.removeEventListener('message', this.handleIframeIsClosing)
  }

  loadContent = async () => {
    const { content } = this.state
    const fetchResultFile = await handleFetchResult(await getFileContent(this.props.config.apiUrl, content.workspace_id, content.content_id))

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

  setIframeConf = async () => {
    const { state, props } = this
    if (!state.content.file_extension) {
      return
    }

    const response = await handleFetchResult(
      await getWOPIDiscovery(props.config.apiUrl, state.content.workspace_id, state.content.content_id)
    )
    switch (response.apiResponse.status) {
      case 200:
        if (response.body.extensions.includes(state.content.file_extension.substr(1))) {
          this.setState({
            accessToken: response.body.access_token,
            iframeUrl: this.buildCompleteIframeUrl(response.body.urlsrc)
          })
        } else {
          console.log('lol')
        }
        break
      default:
        console.log('lol')
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

export default translate()(CollaboraFrame)
