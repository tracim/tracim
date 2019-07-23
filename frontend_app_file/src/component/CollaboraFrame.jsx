import React from 'react'
import { translate } from 'react-i18next'
import { PAGE } from '../helper.js'
import {
  handleFetchResult
} from 'tracim_frontend_lib'
import {
  getWOPIToken,
  getFileContent
} from '../action.async.js'

const FORM_ID = 'loleafletform'
const IFRAME_ID = 'loleafletframe'
const CONTENT_TYPE_FILE = 'file'
const ACTION_EDIT = 'edit'
const HOST = 'http://192.168.1.228:6543'

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
      accessToken: '',
      editorUrl: ''
    }
  }

  buildCompleteIframeUrl = (urlSource, accessToken) => {
    const { state } = this
    return `${urlSource}WOPISrc=${HOST}${PAGE.ONLINE_EDITION(state.content.content_id)}&access_token=${accessToken}&closebutton=1`
  }

  handleIframeIsClosing = (event) => {
    if (JSON.parse(event.data).MessageId === 'close') {
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

  setIframeConf = async () => {
    const { state, props } = this

    if (!state.content.file_extension) {
      return
    }
    const editorType = props.config.system.config.collaborative_document_edition.supported_file_types.filter(
      (type) => type.extension === state.content.file_extension.substr(1) && type.associated_action === ACTION_EDIT
    )

    if (editorType.length === 0) {
      this.props.history.push(
        PAGE.WORKSPACE.CONTENT(this.state.content.workspace_id, CONTENT_TYPE_FILE, this.state.content.content_id)
      )
    }

    const response = await handleFetchResult(
      await getWOPIToken(props.config.apiUrl)
    )
    switch (response.apiResponse.status) {
      case 200:
        this.setState({
          accessToken: response.body.access_token,
          editorUrl: editorType[0].url_source,
          iframeUrl: this.buildCompleteIframeUrl(editorType[0].url_source, response.body.access_token)
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

export default translate()(CollaboraFrame)
