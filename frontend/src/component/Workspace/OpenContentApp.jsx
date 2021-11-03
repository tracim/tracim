import React from 'react'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import appFactory from '../../util/appFactory.js'
import { findUserRoleIdInWorkspace } from '../../util/helper.js'
import { ROLE_LIST, CUSTOM_EVENT, CONTENT_TYPE } from 'tracim_frontend_lib'
import { HACK_COLLABORA_CONTENT_TYPE } from '../../container/WorkspaceContent.jsx'
import { newFlashMessage, readContentNotification } from '../../action-creator.sync.js'
import { putContentNotificationAsRead } from '../../action-creator.async.js'

// @FIXME Côme - 2018/07/31 - should this be in a component like AppFeatureManager ?
export class OpenContentApp extends React.Component {
  openContentApp = async (prevProps = {}) => {
    const {
      appList,
      dispatch,
      workspaceId,
      appOpenedType,
      user,
      currentWorkspace,
      contentType,
      renderAppFeature,
      dispatchCustomEvent,
      match,
      t
    } = this.props

    // RJ - 2020-01-13 - NOTE: match.params.idcts can be equal to "new"

    if (
      !match || !workspaceId || workspaceId === -1 || isNaN(match.params.idcts) ||
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

    const parentId = contentToOpen.type === CONTENT_TYPE.FOLDER ? null : contentToOpen.content_id

    if (prevProps.match && prevProps.match.params.idws && match.params.idws === prevProps.match.params.idws) {
      if (appOpenedType === contentToOpen.type) {
        // The app is already open in the same workspace, just request a reload
        // for the new content
        dispatchCustomEvent(CUSTOM_EVENT.RELOAD_CONTENT(contentToOpen.type), contentToOpen)
        await this.readContentNotifications(user.userId, contentToOpen.content_id, parentId)
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
    await this.readContentNotifications(user.userId, contentToOpen.content_id, parentId)

    if (contentToOpen.type !== appOpenedType) {
      this.props.onUpdateAppOpenedType(contentToOpen.type)
    }
  }

  readContentNotifications = async (userId, contentId, parentId) => {
    const { props } = this
    const fetchPutContentNotificationAsRead = await props.dispatch(putContentNotificationAsRead(userId, contentId, parentId))
    switch (fetchPutContentNotificationAsRead.status) {
      case 204:
        props.dispatch(readContentNotification(contentId))
        break
      default: props.dispatch(newFlashMessage(props.t('Error while marking the notification as read'), 'warning'))
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
export default withRouter(connect(mapStateToProps)(translate()(appFactory(OpenContentApp))))
