import React from 'react'
import ReactDOM from 'react-dom'
import { Router } from 'react-router'
import AdminWorkspaceUser from './container/AdminWorkspaceUser.jsx'
import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

require('./css/index.styl')

const appInterface = {
  name: 'admin_workspace_user',
  isRendered: false,
  renderAppFullscreen: data => {
    document.getElementById(data.config.domContainer).classList.add('fullWidthFullHeight')

    return ReactDOM.render(
      <Router history={data.config.history}>
        <DragDropContextProvider backend={HTML5Backend}>
          <AdminWorkspaceUser data={data} />
        </DragDropContextProvider>
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
