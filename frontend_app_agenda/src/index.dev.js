import React from 'react'
import ReactDOM from 'react-dom'
import 'regenerator-runtime/runtime'
import { Router } from 'react-router-dom'
import Agenda from './container/Agenda.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'

require('./css/index.styl')

// INFO - CH - 2020-01-12 - Router is required because we have <Link> in <PageTitle> component
const history = require('history').createBrowserHistory()

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <Router history={history}>
    <Agenda data={undefined} />
  </Router>
  , document.getElementById('content')
)
