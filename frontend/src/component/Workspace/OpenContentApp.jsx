import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import appFactory from '../../appFactory.js'

// @FIXME Côme - 2018/07/31 - should this be in a component like AppFeatureManager ?
export class OpenContentApp extends React.Component {
  openContentApp = () => {
    const { idWorkspace, appOpenedType, user, workspaceContentList, contentType, renderAppFeature, dispatchCustomEvent, match } = this.props

    if (isNaN(idWorkspace) || idWorkspace === -1) return

    if (['type', 'idcts'].every(p => p in match.params) && match.params.type !== 'contents' && workspaceContentList.length) {
      if (isNaN(match.params.idcts) || !contentType.map(c => c.slug).includes(match.params.type)) return

      const contentToOpen = {
        content_id: parseInt(match.params.idcts),
        workspace_id: parseInt(idWorkspace),
        type: match.params.type
      }

      console.log('%c<OpenContentApp> contentToOpen', 'color: #dcae84', contentToOpen)

      if (appOpenedType === contentToOpen.type) { // app already open
        dispatchCustomEvent(`${contentToOpen.type}_reloadContent`, contentToOpen)
      } else { // open another app
        // if another app is already visible, hide it
        if (appOpenedType !== false) dispatchCustomEvent(`${appOpenedType}_hideApp`, {})
        // open app
        renderAppFeature(
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

const mapStateToProps = ({ user, workspaceContentList, contentType }) => ({ user, workspaceContentList, contentType })
export default withRouter(connect(mapStateToProps)(appFactory(OpenContentApp)))
