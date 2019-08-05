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
    const { props, state } = this
    if (JSON.parse(event.data).MessageId === 'close') {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.REDIRECT,
        data: {
          url: PAGE.WORKSPACE.CONTENT(props.data.content.workspace_id, state.content.content_type, props.data.content.content_id)
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
    console.log('%c<CollaboraFrame> did mount', `color: ${this.props.data.config.hexcolor}`)
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
          case 2023:
            GLOBAL_dispatchEvent({
              type: CUSTOM_EVENT.REDIRECT,
              data: {
                url: `/ui/workspaces/${props.data.content.workspace_id}/contents`
              }
            })
            throw new Error(response.body.message)
          case 2022:
            GLOBAL_dispatchEvent({
              type: CUSTOM_EVENT.REDIRECT,
              data: {
                url: `/ui`
              }
            })
            throw new Error(response.body.message)
        }
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while loading file'))
        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.REDIRECT,
          data: {
            url: '/ui'
          }
        })
        throw new Error('Unknown error')
    }
  }

  setIframeConfig = async () => {
    const { state, props } = this
    if (!state.content.file_extension) {
      return
    }
    if (!props.data.config.system.config.collaborative_document_edition) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.OPEN_CONTENT_URL,
        data: {
          workspaceId: props.data.content.workspace_id,
          contentType: state.content.content_type,
          contentId: props.data.content.content_id
        }
      })
      return
    }
    const softwareFileType = props.data.config.system.config.collaborative_document_edition.supported_file_types.find(
      (type) => type.extension === state.content.file_extension.substr(1) && type.associated_action === ACTION_EDIT
    )

    if (!softwareFileType) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.OPEN_CONTENT_URL,
        data: {
          workspaceId: props.data.content.workspace_id,
          contentType: state.content.content_type,
          contentId: props.data.content.content_id
        }
      })
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
