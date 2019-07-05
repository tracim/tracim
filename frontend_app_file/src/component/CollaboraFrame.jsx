import React from 'react'
import { translate } from 'react-i18next'
import {
  debug
} from '../helper.js'

const FORM_ID = 'loleafletform'
const IFRAME_ID = 'loleafletframe'

const qs = require('query-string')

class CollaboraFrame extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      iframeUrl: this.buildCompleteIframeUrl(props.iframeUrl),
      config: props.data ? props.data.config : debug.config,
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
      }
    }
  }

  buildCompleteIframeUrl = (iframeUrl) => {
    return `${iframeUrl}&closebutton=1`
  }

  handleIframeIsClosing = (event) => {
    if (JSON.parse(event.data).MessageId === 'close') {
      this.props.showCollaboraFrame(false)
      let parsedSearch = qs.parse(window.location.search)
      if (parsedSearch.onlineedition) {
        delete parsedSearch.onlineedition
        window.location.search = qs.stringify(parsedSearch)
      }
    }
  }

  showIframe = () => {
    document.getElementById(this.state.formId).submit()
  }

  componentDidMount () {
    console.log('%c<CollaboraFrame> did mount', `color: ${this.state.config.hexcolor}`)
    this.showIframe()
    window.addEventListener('message', this.handleIframeIsClosing, false)
  }

  componentWillUnmount () {
    console.log('%c<File> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener('message', this.handleIframeIsClosing)
  }

  render () {
    return (
      <div>
        <form id={this.state.formId} name={this.state.formId} target={this.state.iframeId} action={this.state.iframeUrl} method='post'>
          <input name='access_token' value={this.props.accessToken} type='hidden' />
        </form>
        <iframe id={this.state.iframeId} name={this.state.iframeId} allowfullscreen style={this.state.iframeStyle} />
      </div>
    )
  }
}

export default translate()(CollaboraFrame)
