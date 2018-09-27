import React from 'react'
import ReactDOM from 'react-dom'
import AdminWorkspaceUser from './container/AdminWorkspaceUser.jsx'

require('./css/index.styl')

ReactDOM.render(
  <AdminWorkspaceUser data={undefined} />
  , document.getElementById('content')
)
