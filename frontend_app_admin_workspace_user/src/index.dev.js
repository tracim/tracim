import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { Router } from 'react-router-dom'
import AdminWorkspaceUser from './container/AdminWorkspaceUser.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'

require('./css/index.styl')

const history = require('history').createBrowserHistory()

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <AdminWorkspaceUser data={undefined} />
  </Router>
  , document.getElementById('content')
)
