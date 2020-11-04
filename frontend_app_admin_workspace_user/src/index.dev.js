import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import AdminWorkspaceUser from './container/AdminWorkspaceUser.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'

require('./css/index.styl')

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <AdminWorkspaceUser data={undefined} />
  , document.getElementById('content')
)
