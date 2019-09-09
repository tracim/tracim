import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import AdminWorkspaceUser from './container/AdminWorkspaceUser.jsx'

require('./css/index.styl')

ReactDOM.render(
  <AdminWorkspaceUser data={undefined} />
  , document.getElementById('content')
)
