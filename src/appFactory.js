import React from 'react'
import { FETCH_CONFIG } from './helper.js'

export function appFactory (WrappedComponent) {
  return class AppFactory extends React.Component {
    renderApp = (appConfig, user, content) => GLOBAL_renderApp({
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

    renderCreateContentApp = (appConfig, user, idWorkspace, idFolder) => GLOBAL_renderCreateContentApp({
      loggedUser: user.logged ? user : {},
      config: {
        ...appConfig,
        domContainer: 'popupCreateContentContainer',
        apiUrl: FETCH_CONFIG.apiUrl,
        mockApiUrl: FETCH_CONFIG.mockApiUrl,
        apiHeader: FETCH_CONFIG.headers
      },
      idWorkspace,
      idFolder
    })

    emitEventApp = (type, data) => GLOBAL_dispatchEvent(type, data)

    render () {
      return (
        <WrappedComponent
          {...this.props}
          renderApp={this.renderApp}
          renderCreateContentApp={this.renderCreateContentApp}
          emitEventApp={this.emitEventApp}
          // hideApp={this.hideApp}
        />
      )
    }
  }
}

export default appFactory
