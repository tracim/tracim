import React from 'react'
import { FETCH_CONFIG } from './helper.js'

export function appFactory (WrappedComponent) {
  return class AppFactory extends React.Component {
    renderAppFull = (appConfig, user, content) => GLOBAL_renderAppFull({
      loggedUser: user.logged ? user : {},
      config: {
        ...appConfig,
        domContainer: 'appContainer',
        apiUrl: FETCH_CONFIG.apiUrl,
        mockApiUrl: FETCH_CONFIG.mockApiUrl,
        apiHeader: FETCH_CONFIG.headers
      },
      content
    })

    renderAppPopupCreation = (appConfig, user, idWorkspace, idFolder) => GLOBAL_renderAppPopupCreation({
      loggedUser: user.logged ? user : {},
      config: {
        ...appConfig,
        domContainer: 'popupCreateContentContainer',
        apiUrl: FETCH_CONFIG.apiUrl,
        mockApiUrl: FETCH_CONFIG.mockApiUrl,
        apiHeader: FETCH_CONFIG.headers // should this be used by app ? right now, apps have their own headers
      },
      idWorkspace,
      idFolder
    })

    emitEventApp = (type, data) => GLOBAL_dispatchEvent({ type, data })

    render () {
      return (
        <WrappedComponent
          {...this.props}
          renderAppFull={this.renderAppFull}
          renderAppPopupCreation={this.renderAppPopupCreation}
          emitEventApp={this.emitEventApp}
          // hideApp={this.hideApp}
        />
      )
    }
  }
}

export default appFactory
