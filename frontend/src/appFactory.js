import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { FETCH_CONFIG, PAGE, findUserRoleIdInWorkspace } from './helper.js'
import i18n from './i18n.js'
import { ROLE_LIST, PROFILE } from 'tracim_frontend_lib'

const mapStateToProps = ({ system, currentWorkspace, workspaceList }) => ({ system, currentWorkspace, workspaceList })

export function appFactory (WrappedComponent) {
  return withRouter(connect(mapStateToProps)(class AppFactory extends React.Component {
    renderAppFeature = (appConfig, user, userRoleIdInWorkspace, content) => GLOBAL_renderAppFeature({
      loggedUser: user.logged
        ? { ...user, userRoleIdInWorkspace }
        : {},
      config: {
        ...appConfig,
        domContainer: 'appFeatureContainer',
        apiUrl: FETCH_CONFIG.apiUrl,
        apiHeader: FETCH_CONFIG.headers,
        translation: i18n.store.data,
        system: this.props.system,
        roleList: ROLE_LIST,
        profileObject: PROFILE,
        history: this.props.history
      },
      content
    })

    renderAppFullscreen = (appConfig, user, content) => GLOBAL_renderAppFullscreen({
      loggedUser: user.logged
        ? { ...user, userRoleIdInWorkspace: findUserRoleIdInWorkspace(user.user_id, this.props.currentWorkspace.memberList, ROLE_LIST) }
        : {},
      config: {
        ...appConfig,
        domContainer: 'appFullscreenContainer',
        apiUrl: FETCH_CONFIG.apiUrl,
        apiHeader: FETCH_CONFIG.headers,
        translation: i18n.store.data,
        system: this.props.system,
        roleList: ROLE_LIST,
        profileObject: PROFILE,
        history: this.props.history
      },
      content
    })

    renderAppPopupCreation = (appConfig, user, workspaceId, folderId) => GLOBAL_renderAppPopupCreation({
      loggedUser: user.logged ? user : {},
      config: {
        ...appConfig,
        domContainer: 'popupCreateContentContainer',
        apiUrl: FETCH_CONFIG.apiUrl,
        apiHeader: FETCH_CONFIG.headers, // should this be used by app ? right now, apps have their own headers
        translation: i18n.store.data,
        system: this.props.system,
        roleList: ROLE_LIST,
        profileObject: PROFILE,
        history: this.props.history,
        PAGE: PAGE
      },
      workspaceId,
      folderId: folderId === 'null' ? null : folderId
    })

    dispatchCustomEvent = (type, data) => GLOBAL_dispatchEvent({ type, data })

    render () {
      return (
        <WrappedComponent
          {...this.props}
          renderAppFeature={this.renderAppFeature}
          renderAppFullscreen={this.renderAppFullscreen}
          renderAppPopupCreation={this.renderAppPopupCreation}
          dispatchCustomEvent={this.dispatchCustomEvent}
          // hideApp={this.hideApp}
        />
      )
    }
  }))
}
export default appFactory
