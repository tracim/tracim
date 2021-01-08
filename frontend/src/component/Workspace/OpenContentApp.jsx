import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import appFactory from '../../util/appFactory.js'
import { findUserRoleIdInWorkspace } from '../../util/helper.js'
import { ROLE_LIST, CUSTOM_EVENT } from 'tracim_frontend_lib'
import { HACK_COLLABORA_CONTENT_TYPE } from '../../container/WorkspaceContent.jsx'

// @FIXME Côme - 2018/07/31 - should this be in a component like AppFeatureManager ?
export class OpenContentApp extends React.Component {
  openContentApp = (prevProps = {}) => {
    const {
      appList,
      workspaceId,
      appOpenedType,
      user,
      currentWorkspace,
      contentType,
      renderAppFeature,
      dispatchCustomEvent,
      match
    } = this.props

    if (
      !match || !workspaceId || workspaceId === -1 || !match.params.idcts ||
      (prevProps.match && appOpenedType && match.params.idcts === prevProps.match.params.idcts)
    ) return

    const typeObj = contentType.find(ct => ct.slug === match.params.type)
    if (!typeObj) return

    const contentToOpen = {
      content_id: parseInt(match.params.idcts),
      workspace_id: parseInt(match.params.idws),
      type: match.params.type
    }

    console.log('%c<OpenContentApp> contentToOpen', 'color: #dcae84', contentToOpen)

    if (prevProps.match && prevProps.match.params.idws && match.params.idws === prevProps.match.params.idws) {
      if (appOpenedType === contentToOpen.type) {
        // The app is already open in the same workspace, just request a reload
        // for the new content
        dispatchCustomEvent(CUSTOM_EVENT.RELOAD_CONTENT(contentToOpen.type), contentToOpen)
        return
      }

      // Otherwise, if another app is already visible, hide it so we can open
      // the right app later
      if (appOpenedType) {
        dispatchCustomEvent(CUSTOM_EVENT.HIDE_APP(appOpenedType), {})
      }
    }

    const contentInformation = {
      ...typeObj,
      workspace: {
        label: currentWorkspace.label,
        downloadEnabled: currentWorkspace.downloadEnabled && appList.some(a => a.slug === 'share_content'),
        memberList: currentWorkspace.memberList
      }
    }

    // Open the app. If the app is already open in another workspace, it will be
    // unmounted by renderAppFeature
    renderAppFeature(
      contentInformation,
      user,
      findUserRoleIdInWorkspace(user.userId, currentWorkspace.memberList, ROLE_LIST),
      contentToOpen
    )

    if (contentToOpen.type !== appOpenedType) {
      this.props.onUpdateAppOpenedType(contentToOpen.type)
    }
  }

  componentDidMount () {
    console.log('%c<OpenContentApp> did Mount', 'color: #dcae84', this.props)
    this.openContentApp()
  }

  componentDidUpdate (prevProps) {
    console.log('%c<OpenContentApp> did Update', 'color: #dcae84', this.props)
    this.openContentApp(prevProps)
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ appList, user, currentWorkspace, contentType }) => ({
  appList,
  user,
  currentWorkspace,
  contentType: [
    ...contentType,
    // FIXME - CH - 2019-09-06 - hack for content type. See https://github.com/tracim/tracim/issues/2375
    HACK_COLLABORA_CONTENT_TYPE(contentType)
  ]
})
export default withRouter(connect(mapStateToProps)(appFactory(OpenContentApp)))
