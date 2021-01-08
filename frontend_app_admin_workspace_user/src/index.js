import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { Router } from 'react-router-dom'
import AdminWorkspaceUser from './container/AdminWorkspaceUser.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'admin_workspace_user',
  isRendered: false,
  renderAppFullscreen: data => {
    document.getElementById(data.config.domContainer).classList.add('fullWidthFullHeight')

    return ReactDOM.render(
      <Router history={data.config.history}>
        <AdminWorkspaceUser data={data} />
      </Router>
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    document.getElementById(domId).classList.remove('fullWidthFullHeight')

    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
  // renderAppPopupCreation: data => {
  //   return null
  // }
}

export default appInterface
