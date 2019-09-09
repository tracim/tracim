import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import FolderAdvanced from './container/FolderAdvanced.jsx'

require('./css/index.styl')

ReactDOM.render(
  <FolderAdvanced data={undefined} />
  , document.getElementById('content')
)
