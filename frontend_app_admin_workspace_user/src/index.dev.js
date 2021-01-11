import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { BrowserRouter } from 'react-router-dom'
import AdminWorkspaceUser from './container/AdminWorkspaceUser.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'

require('./css/index.styl')

const history = require('history').createBrowserHistory()

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <BrowserRouter history={history}>
    <AdminWorkspaceUser data={undefined} />
  </BrowserRouter>
  , document.getElementById('content')
)
