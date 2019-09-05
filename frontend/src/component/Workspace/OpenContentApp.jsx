import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import appFactory from '../../appFactory.js'
import { ROLE, findUserRoleIdInWorkspace } from '../../helper.js'
import { CUSTOM_EVENT } from 'tracim_frontend_lib'
import { HACK_COLLABORA_CONTENT_TYPE } from '../../container/WorkspaceContent.jsx'

// @FIXME Côme - 2018/07/31 - should this be in a component like AppFeatureManager ?
export class OpenContentApp extends React.Component {
  openContentApp = () => {
    const {
      workspaceId,
      appOpenedType,
      user,
      currentWorkspace,
      contentType,
      renderAppFeature,
      dispatchCustomEvent,
      match
    } = this.props

    if (isNaN(workspaceId) || workspaceId === -1) return

    if (['type', 'idcts'].every(p => p in match.params) && match.params.type !== 'contents') {
      if (isNaN(match.params.idcts) || !contentType.map(c => c.slug).includes(match.params.type)) return

      const contentToOpen = {
        content_id: parseInt(match.params.idcts),
        workspace_id: parseInt(workspaceId),
        type: match.params.type
      }

      console.log('%c<OpenContentApp> contentToOpen', 'color: #dcae84', contentToOpen)

      if (appOpenedType === contentToOpen.type) { // app already open
        dispatchCustomEvent(CUSTOM_EVENT.RELOAD_CONTENT(contentToOpen.type), contentToOpen)
      } else { // open another app
        // if another app is already visible, hide it
        if (appOpenedType !== false) dispatchCustomEvent(CUSTOM_EVENT.HIDE_APP(appOpenedType), {})
        // open app
        renderAppFeature(
          contentType.find(ct => ct.slug === contentToOpen.type),
          user,
          findUserRoleIdInWorkspace(user.user_id, currentWorkspace.memberList, ROLE),
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

  componentDidUpdate (prevProps) {
    const { props } = this
    console.log('%c<OpenContentApp> did Update', 'color: #dcae84', this.props)

    if (props.match && prevProps.match && props.match.params.idws !== prevProps.match.params.idws) {
      props.updateAppOpenedType(false)
      props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP)
    }

    if (props.match && prevProps.match && props.match.params.idcts === prevProps.match.params.idcts) return

    this.openContentApp()
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ user, currentWorkspace, contentType }) => ({
  user,
  currentWorkspace,
  contentType: [
    ...contentType,
    HACK_COLLABORA_CONTENT_TYPE(contentType)
  ]
})
export default withRouter(connect(mapStateToProps)(appFactory(OpenContentApp)))
