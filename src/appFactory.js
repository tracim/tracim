import React from 'react'
import { FETCH_CONFIG } from './helper.js'

export function appFactory (WrappedComponent) {
  return class AppFactory extends React.Component {
    renderApp = (appConfig, user, content) => GLOBAL_renderApp({
      loggedUser: user.isLoggedIn ? user : {},
      config: {
        ...appConfig,
        apiUrl: FETCH_CONFIG.apiUrl
      },
      content
    })

    emitEventApp = (type, data) => GLOBAL_dispatchEvent(type, data)

    hideApp = appName => GLOBAL_hideApp(appName)

    render () {
      return (
        <WrappedComponent
          {...this.props}
          renderApp={this.renderApp}
          emitEventApp={this.emitEventApp}
          hideApp={this.hideApp}
        />
      )
    }
  }
}

export default appFactory
