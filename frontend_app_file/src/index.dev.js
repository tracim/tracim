import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import File from './container/File.jsx'
import { debug } from './debug.js'
import { Router } from 'react-router-dom'
import { LiveMessageManager } from 'tracim_frontend_lib'

export const history = require('history').createBrowserHistory()

// import PopupCreateFile from './container/PopupCreateFile.jsx'

require('./css/index.styl')

// ReactDOM.render(
//   <PopupCreateFile />
//   , document.getElementById('content')
// )

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <File data={undefined} />
  </Router>
  , document.getElementById('content')
)
