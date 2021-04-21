import React from 'react'
import ReactDOM from 'react-dom'
import WorkspaceAdvanced from './container/WorkspaceAdvanced.jsx'
import { Router } from 'react-router-dom'

require('./css/index.styl')

const appInterface = {
  name: 'workspace_advanced',
  isRendered: false,
  renderAppFeature: data => {
    return ReactDOM.render(
      <Router history={data.config.history}>
        <WorkspaceAdvanced data={data} />
      </Router>
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
