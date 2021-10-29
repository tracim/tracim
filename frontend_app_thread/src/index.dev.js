import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import Thread from './container/Thread.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'
// import PopupCreateThread from './container/PopupCreateThread.jsx'
import { Router } from 'react-router-dom'

export const history = require('history').createBrowserHistory()

require('./css/index.styl')

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <Thread data={debug} />
  </Router>
  , document.getElementById('content')
)

// ReactDOM.render(
//   <PopupCreateThread />
//   , document.getElementById('content')
// )
