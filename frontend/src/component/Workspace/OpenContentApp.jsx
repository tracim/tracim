import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import appFactory from '../../util/appFactory.js'
import { findUserRoleIdInWorkspace } from '../../util/helper.js'
import { ROLE_LIST, CUSTOM_EVENT } from 'tracim_frontend_lib'
import { HACK_COLLABORA_CONTENT_TYPE } from '../../container/WorkspaceContent.jsx'

// @FIXME Côme - 2018/07/31 - should this be in a component like AppFeatureManager ?
export class OpenContentApp extends React.Component {
  openContentApp = () => {
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

    if (isNaN(workspaceId) || workspaceId === -1) return

    if (['type', 'idcts'].every(p => p in match.params) && match.params.type !== 'contents') {
      if (isNaN(match.params.idcts) || !contentType.map(c => c.slug).includes(match.params.type)) return

      const contentToOpen = {
        content_id: parseInt(match.params.idcts),
        workspace_id: parseInt(match.params.idws),
        type: match.params.type
      }

      console.log('%c<OpenContentApp> contentToOpen', 'color: #dcae84', contentToOpen)

      if (appOpenedType === contentToOpen.type) { // app already open
        dispatchCustomEvent(CUSTOM_EVENT.RELOAD_CONTENT(contentToOpen.type), contentToOpen)
      } else { // open another app
        // if another app is already visible, hide it
        if (appOpenedType !== false) dispatchCustomEvent(CUSTOM_EVENT.HIDE_APP(appOpenedType), {})

        const contentInformation = {
          ...contentType.find(ct => ct.slug === contentToOpen.type),
          workspace: {
            label: currentWorkspace.label,
            downloadEnabled: currentWorkspace.downloadEnabled && appList.some(a => a.slug === 'share_content'),
            memberList: currentWorkspace.memberList
          }
        }
        // open app
        renderAppFeature(
          contentInformation,
          user,
          findUserRoleIdInWorkspace(user.userId, currentWorkspace.memberList, ROLE_LIST),
          contentToOpen
        )
        this.props.onUpdateAppOpenedType(contentToOpen.type)
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
      props.onUpdateAppOpenedType(false)
      props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP)
    }

    if (props.match && prevProps.match && props.match.params.idcts === prevProps.match.params.idcts) return

    this.openContentApp()
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
