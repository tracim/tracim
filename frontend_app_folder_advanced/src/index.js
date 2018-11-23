import React from 'react'
import ReactDOM from 'react-dom'
import FolderAdvanced from './container/FolderAdvanced.jsx'
import PopupCreateFolder from './container/PopupCreateFolder.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'folder',
  isRendered: false,
  renderAppFeature: data => {
    // if loggedUser isn't at least content manager, do not open the advanced folder app
    if (data && data.loggedUser && data.loggedUser.idRoleUserWorkspace <= 4) return

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

module.exports = appInterface
