import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import Gallery from './container/Gallery.jsx'
import { debug } from './debug.js'
import { Router } from 'react-router-dom'
import { LiveMessageManager } from 'tracim_frontend_lib'

export const history = require('history').createBrowserHistory()

require('./css/index.styl')

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <Gallery data={undefined} />
  </Router>
  , document.getElementById('content')
)
