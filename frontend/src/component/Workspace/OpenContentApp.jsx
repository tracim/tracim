import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import appFactory from '../../appFactory.js'
import { ROLE, findUserRoleIdInWorkspace } from '../../helper.js'
import { CUSTOM_EVENT } from 'tracim_frontend_lib'

// @FIXME Côme - 2018/07/31 - should this be in a component like AppFeatureManager ?
export class OpenContentApp extends React.Component {
  openContentApp = () => {
    const {
      idWorkspace,
      appOpenedType,
      user,
      currentWorkspace,
      contentType,
      customFormContentType,
      renderAppFeature,
      dispatchCustomEvent,
      match
    } = this.props

    if (isNaN(idWorkspace) || idWorkspace === -1) return

    if (['type', 'idcts'].every(p => p in match.params) && match.params.type !== 'contents') {
      if (isNaN(match.params.idcts) || !contentType.map(c => c.slug).includes(match.params.type)) return

      // HACK
      let contentToOpen = {}
      if (match.params.type === 'html-document') {
        contentToOpen = {
          content_id: parseInt(match.params.idcts),
          workspace_id: parseInt(idWorkspace),
          type: 'custom-form'
        }
      } else {
        contentToOpen = {
          content_id: parseInt(match.params.idcts),
          workspace_id: parseInt(idWorkspace),
          type: match.params.type
        }
      }
      // FINHACK
      // const contentToOpen = {
      //    content_id: parseInt(match.params.idcts),
      //    workspace_id: parseInt(idWorkspace),
      //    type: match.params.type
      //  }
      // ORIGINAL
      console.log('PropsContentToOpen', this.props)
      console.log('%c<OpenContentApp> contentToOpen', 'color: #dcae84', contentToOpen)

      if (appOpenedType === contentToOpen.type) { // app already open
        console.log('ABCalreadyOpen')
        dispatchCustomEvent(`${contentToOpen.type}_reloadContent`, contentToOpen)
      } else { // open another app
        // if another app is already visible, hide it
        console.log('ABCappOpenedType00', appOpenedType)
        if (appOpenedType !== false) dispatchCustomEvent(`${appOpenedType}_hideApp`, {})

        // open
        // Hard coding the custom-form case, he need another contentType stored in the customFormContentType props
        let contentToOpenType = contentType.find(ct => ct.slug === contentToOpen.type)
        if (contentToOpen.type === 'custom-form') contentToOpenType = customFormContentType.find(ct => ct.slug === contentToOpen.type)
        renderAppFeature(
          contentToOpenType,
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

const mapStateToProps = ({ user, currentWorkspace, contentType, customFormContentType }) => ({
  user, currentWorkspace, contentType, customFormContentType
})
export default withRouter(connect(mapStateToProps)(appFactory(OpenContentApp)))
