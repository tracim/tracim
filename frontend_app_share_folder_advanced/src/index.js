import React from 'react'
import ReactDOM from 'react-dom'
import FolderAdvanced from './container/FolderAdvanced.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'share_folder',
  isRendered: false,
  renderAppFeature: data => {
    if (data && data.loggedUser && data.loggedUser.userRoleIdInWorkspace < 4) return //TODO error

    return ReactDOM.render(
      <FolderAdvanced data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

export default appInterface
