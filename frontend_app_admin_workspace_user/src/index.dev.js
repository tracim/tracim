import React from 'react'
import ReactDOM from 'react-dom'
import AdminWorkspaceUser from './container/AdminWorkspaceUser.jsx'
// import PopupCreateHtmlDocument from './container/PopupCreateHtmlDocument.jsx'

require('./css/index.styl')

ReactDOM.render(
  <AdminWorkspaceUser data={undefined} />
  , document.getElementById('content')
)

// ReactDOM.render(
//   <PopupCreateHtmlDocument />
//   , document.getElementById('content')
// )
