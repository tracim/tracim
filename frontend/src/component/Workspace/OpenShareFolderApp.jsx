import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import appFactory from '../../util/appFactory.js'
import { findUserRoleIdInWorkspace } from '../../util/helper.js'
import { ROLE_LIST, CUSTOM_EVENT } from 'tracim_frontend_lib'

export class OpenShareFolderApp extends React.Component {
  openShareFolderAdvancedApp = () => {
    const {
      workspaceId,
      appOpenedType,
      user,
      currentWorkspace,
      renderAppFeature,
      dispatchCustomEvent
    } = this.props

    if (isNaN(workspaceId) || workspaceId === -1) return

    const contentToOpen = {
      workspace_id: parseInt(workspaceId),
      type: 'share_folder'
    }

    console.log('%c<OpenShareFolderApp> contentToOpen', 'color: #dcae84', contentToOpen)

    if (appOpenedType === contentToOpen.type) { // app already open
      dispatchCustomEvent(CUSTOM_EVENT.RELOAD_CONTENT(contentToOpen.type), contentToOpen)
    } else { // open another app
      // if another app is already visible, hide it
      if (appOpenedType) dispatchCustomEvent(CUSTOM_EVENT.HIDE_APP(appOpenedType), {})
      // open app
      const shareConfig = {
        slug: 'share_folder',
        faIcon: 'share-alt',
        hexcolor: '#414548',
        label: 'Share folder',
        workspace: {
          label: currentWorkspace.label
        }
      }
      renderAppFeature(
        shareConfig,
        user,
        findUserRoleIdInWorkspace(user.userId, currentWorkspace.memberList, ROLE_LIST),
        contentToOpen
      )
      this.props.onUpdateAppOpenedType(contentToOpen.type)
    }
  }

  componentDidMount () {
    console.log('%c<OpenShareFolderApp> did Mount', 'color: #dcae84', this.props)

    this.openShareFolderAdvancedApp()
  }

  componentDidUpdate (prevProps) {
    const { props } = this
    console.log('%c<OpenShareFolderApp> did Update', 'color: #dcae84', this.props)

    if (props.match && prevProps.match && props.match.params.idws !== prevProps.match.params.idws) {
      props.onUpdateAppOpenedType(false)
      props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP)
      return
    }

    this.openShareFolderAdvancedApp(false)
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ user, currentWorkspace }) => ({ user, currentWorkspace })
export default withRouter(connect(mapStateToProps)(appFactory(OpenShareFolderApp)))
