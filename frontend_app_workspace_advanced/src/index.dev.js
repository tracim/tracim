import React from 'react'
import ReactDOM from 'react-dom'
import 'regenerator-runtime/runtime'
import WorkspaceAdvanced from './container/WorkspaceAdvanced.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'
import { Router } from 'react-router-dom'

export const history = require('history').createBrowserHistory()

require('./css/index.styl')

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <WorkspaceAdvanced data={debug} />
  </Router>
  , document.getElementById('content')
)
