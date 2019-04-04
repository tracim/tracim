import React from 'react'
import ReactDOM from 'react-dom'
import { Router } from 'react-router'
import AdminWorkspaceUser from './container/AdminWorkspaceUser.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'admin_workspace_user',
  isRendered: false,
  renderAppFullscreen: data => {
    return ReactDOM.render(
      <Router history={data.config.history}>
        <AdminWorkspaceUser data={data} />
      </Router>
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
  // renderAppPopupCreation: data => {
  //   return null
  // }
}

export default appInterface
