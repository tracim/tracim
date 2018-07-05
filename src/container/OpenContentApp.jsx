import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import appFactory from '../appFactory.js'

export class OpenContentApp extends React.Component {
  openContentApp = () => {
    const { idWorkspace, appOpened, user, workspaceContent, contentType, renderApp, match } = this.props

    if (isNaN(idWorkspace)) return

    if (['type', 'idcts'].every(p => p in match.params) && match.params.type !== 'contents' && workspaceContent.id !== -1 && workspaceContent.length) {
      if (isNaN(match.params.idcts) || !contentType.map(c => c.slug).includes(match.params.type)) return

      const contentToOpen = {
        content_id: parseInt(match.params.idcts),
        workspace_id: parseInt(idWorkspace),
        type: match.params.type
      }

      console.log('contentToOpen', contentToOpen)

      if (!appOpened) {
        renderApp(
          contentType.find(ct => ct.slug === contentToOpen.type),
          user,
          contentToOpen
        )
        this.props.updateAppOpened(true)
      } else {
        GLOBAL_dispatchEvent({
          type: 'html-documents_reloadContent', // handled by html-documents:src/container/HtmlDocument.jsx
          data: contentToOpen
        })
      }
    }
  }

  componentDidMount () {
    console.log('OpenContentApp did Mount', this.props)

    this.openContentApp()
  }

  componentDidUpdate () {
    console.log('OpenContentApp did Update', this.props)

    this.openContentApp()
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ user, workspaceContent, contentType }) => ({ user, workspaceContent, contentType })
export default withRouter(connect(mapStateToProps)(appFactory(OpenContentApp)))
