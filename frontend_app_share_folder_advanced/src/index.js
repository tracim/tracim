import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ShareFolderAdvanced from './container/ShareFolderAdvanced.jsx'
import { ROLE_OBJECT } from 'tracim_frontend_lib'

require('./css/index.styl')

const appInterface = {
  name: 'share_folder',
  isRendered: false,
  renderAppFeature: data => {
    if (data && data.loggedUser && data.loggedUser.userRoleIdInWorkspace < ROLE_OBJECT.contentManager.id) return

    return ReactDOM.render(
      <ShareFolderAdvanced data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

export default appInterface
