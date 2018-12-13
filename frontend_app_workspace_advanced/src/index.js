import React from 'react'
import ReactDOM from 'react-dom'
import WorkspaceAdvanced from './container/WorkspaceAdvanced.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'workspace_advanced',
  isRendered: false,
  renderAppFeature: data => {
    return ReactDOM.render(
      <WorkspaceAdvanced data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderAppPopupCreation: () => {
    return null
  }
}

export default appInterface
