import React from 'react'
import ReactDOM from 'react-dom'
import 'regenerator-runtime/runtime'
import WorkspaceAdvanced from './container/WorkspaceAdvanced.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'

require('./css/index.styl')

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <WorkspaceAdvanced data={undefined} />
  , document.getElementById('content')
)
