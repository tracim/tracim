import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ShareFolderAdvanced from './container/ShareFolderAdvanced.jsx'
import { ROLE } from 'tracim_frontend_lib'
import { Router } from 'react-router-dom'

require('./css/index.styl')

const appInterface = {
  name: 'share_folder',
  isRendered: false,
  renderAppFeature: data => {
    if (data && data.loggedUser && data.loggedUser.userRoleIdInWorkspace < ROLE.contentManager.id) {
      console.log('%c<ShareFolderAdvanced>', 'color: #28a745', 'Error: insufficient rights to open app')
      return
    }

    return ReactDOM.render(
      <Router history={data.config.history}>
        <ShareFolderAdvanced data={data} />
      </Router>
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

export default appInterface
