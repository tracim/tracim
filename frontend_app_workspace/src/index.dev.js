import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
// import Workspace from './container/Workspace.jsx'
import PopupCreateWorkspace from './container/PopupCreateWorkspace.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'

require('./css/index.styl')

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

// ReactDOM.render(
//   <Workspace data={undefined} />
//   , document.getElementById('content')
// )

ReactDOM.render(
  <PopupCreateWorkspace />
  , document.getElementById('content')
)
