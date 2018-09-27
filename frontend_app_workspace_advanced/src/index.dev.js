import React from 'react'
import ReactDOM from 'react-dom'
import WorkspaceAdvanced from './container/WorkspaceAdvanced.jsx'
// import PopupCreateWorkspaceAdvanced from './container/PopupCreateWorkspaceAdvanced.jsx'

require('./css/index.styl')

ReactDOM.render(
  <WorkspaceAdvanced data={undefined} />
  , document.getElementById('content')
)

// ReactDOM.render(
//   <PopupCreateWorkspaceAdvanced />
//   , document.getElementById('content')
// )
