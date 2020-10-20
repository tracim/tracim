import React from 'react'
import ReactDOM from 'react-dom'
import PopupCreateOfficeDocument from './container/PopupCreateOfficeDocument.jsx'
import { Router } from 'react-router'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'

require('./css/index.styl')

export const history = require('history').createBrowserHistory()

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <PopupCreateOfficeDocument />
  </Router>
  , document.getElementById('content')
)
