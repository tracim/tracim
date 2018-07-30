import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import appFactory from '../../appFactory.js'

export class OpenContentApp extends React.Component {
  openContentApp = () => {
    const { idWorkspace, appOpenedType, user, workspaceContent, contentType, renderAppFull, match } = this.props

    if (isNaN(idWorkspace) || idWorkspace === -1) return

    if (['type', 'idcts'].every(p => p in match.params) && match.params.type !== 'contents' && workspaceContent.length) {
      if (isNaN(match.params.idcts) || !contentType.map(c => c.slug).includes(match.params.type)) return

      const contentToOpen = {
        content_id: parseInt(match.params.idcts),
        workspace_id: parseInt(idWorkspace),
        type: match.params.type
      }

      console.log('%c<OpenContentApp> contentToOpen', 'color: #dcae84', contentToOpen)

      if (appOpenedType === contentToOpen.type) { // app already open
        GLOBAL_dispatchEvent({
          type: `${contentToOpen.type}_reloadContent`, // handled by html-document:src/container/HtmlDocument.jsx
          data: contentToOpen
        })
      } else { // open another app
        // if another app is already visible, hide it
        if (appOpenedType !== false) GLOBAL_dispatchEvent({type: `${appOpenedType}_hideApp`})
        // open app
        renderAppFull(
          contentType.find(ct => ct.slug === contentToOpen.type),
          user,
          contentToOpen
        )
        this.props.updateAppOpenedType(contentToOpen.type)
      }
    }
  }

  componentDidMount () {
    console.log('%c<OpenContentApp> did Mount', 'color: #dcae84', this.props)

    this.openContentApp()
  }

  componentDidUpdate () {
    console.log('%c<OpenContentApp> did Update', 'color: #dcae84', this.props)

    this.openContentApp()
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ user, workspaceContent, contentType }) => ({ user, workspaceContent, contentType })
export default withRouter(connect(mapStateToProps)(appFactory(OpenContentApp)))
