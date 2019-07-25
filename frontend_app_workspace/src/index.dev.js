import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
// import Workspace from './container/Workspace.jsx'
import PopupCreateWorkspace from './container/PopupCreateWorkspace.jsx'

require('./css/index.styl')

// ReactDOM.render(
//   <Workspace data={undefined} />
//   , document.getElementById('content')
// )

ReactDOM.render(
  <PopupCreateWorkspace />
  , document.getElementById('content')
)
