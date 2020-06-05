import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
// import Thread from './container/Thread.jsx'
import { LiveMessageManager } from '../../frontend/src/util/LiveMessageManager.js'
import PopupCreateThread from './container/PopupCreateThread.jsx'

require('./css/index.styl')

// INFO - CH - 2020-06-04 - for the app to work, it needs a connection to the TLM.
// So we use the frontend/ connection function
setTimeout(() => {
  const liveMessageManager = new LiveMessageManager()
  liveMessageManager.openLiveMessageConnection(1, 'http://192.168.1.19:7999/api/v2')
}, 1000)

// ReactDOM.render(
//   <Thread />
//   , document.getElementById('content')
// )

ReactDOM.render(
  <PopupCreateThread />
  , document.getElementById('content')
)
