import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import Kanban from './container/Kanban.jsx'
import { debug } from './debug.js'
import { Router } from 'react-router-dom'
import { LiveMessageManager } from 'tracim_frontend_lib'

export const history = require('history').createBrowserHistory()

// import PopupCreateKanban from './container/PopupCreateKanban.jsx'

require('./css/index.styl')

// ReactDOM.render(
//   <PopupCreateKanban />
//   , document.getElementById('content')
// )

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <Kanban data={debug} />
  </Router>
  , document.getElementById('content')
)
