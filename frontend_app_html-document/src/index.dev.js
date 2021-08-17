import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import HtmlDocument from './container/HtmlDocument.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'
// import PopupCreateHtmlDocument from './container/PopupCreateHtmlDocument.jsx'
import { Router } from 'react-router-dom'

export const history = require('history').createBrowserHistory()

require('./css/index.styl')

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <HtmlDocument data={debug} />
  </Router>
  , document.getElementById('content')
)

// ReactDOM.render(
//   <PopupCreateHtmlDocument />
//   , document.getElementById('content')
// )
