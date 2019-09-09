import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import FolderAdvanced from './container/FolderAdvanced.jsx'
import PopupCreateFolder from './container/PopupCreateFolder.jsx'
import { ROLE_OBJECT } from 'tracim_frontend_lib'

require('./css/index.styl')

const appInterface = {
  name: 'folder',
  isRendered: false,
  renderAppFeature: data => {
    // if loggedUser isn't at least content manager, do not open the advanced folder app
    if (data && data.loggedUser && data.loggedUser.userRoleIdInWorkspace < ROLE_OBJECT.contentManager.id) return

    return ReactDOM.render(
      <FolderAdvanced data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateFolder data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
