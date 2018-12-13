import React from 'react'
import ReactDOM from 'react-dom'
// import Workspace from './container/Workspace.jsx'
import PopupCreateWorkspace from './container/PopupCreateWorkspace.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'workspace',
  isRendered: false,
  renderAppFeature: data => {
    return ReactDOM.render(
      null // <Workspace data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateWorkspace data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
