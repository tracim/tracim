import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import FolderAdvanced from './container/FolderAdvanced.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'
import { Router } from 'react-router-dom'

export const history = require('history').createBrowserHistory()

require('./css/index.styl')

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <FolderAdvanced data={undefined} />
  </Router>
  , document.getElementById('content')
)
