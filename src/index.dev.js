import React from 'react'
import ReactDOM from 'react-dom'
import Thread from './container/Thread.jsx'
// import PopupCreateThread from './container/PopupCreateThread.jsx'

require('./css/index.styl')

ReactDOM.render(
  <Thread />
  , document.getElementById('content')
)

// ReactDOM.render(
//   <PopupCreateThread />
//   , document.getElementById('content')
// )
