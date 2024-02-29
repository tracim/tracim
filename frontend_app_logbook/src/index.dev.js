import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import Logbook from './container/Logbook.jsx'
import { debug } from './debug.js'
import { Router } from 'react-router-dom'
import { LiveMessageManager } from 'tracim_frontend_lib'

export const history = require('history').createBrowserHistory()

// import PopupCreateLogbook from './container/PopupCreateLogbook.jsx'

require('./css/index.styl')

// ReactDOM.render(
//   <PopupCreateLogbook />
//   , document.getElementById('content')
// )

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <Logbook data={debug} />
  </Router>
  , document.getElementById('content')
)
