import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import File from './container/File.jsx'
import { debug } from './debug.js'
import { LiveMessageManager } from 'tracim_frontend_lib'

// import PopupCreateFile from './container/PopupCreateFile.jsx'

require('./css/index.styl')

// ReactDOM.render(
//   <PopupCreateFile />
//   , document.getElementById('content')
// )

const manager = new LiveMessageManager()
manager.openLiveMessageConnection(debug.loggedUser.userId, debug.config.apiUrl)

ReactDOM.render(
  <File data={undefined} />
  , document.getElementById('content')
)
