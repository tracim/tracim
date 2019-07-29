import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ShareFolderAdvanced from './container/ShareFolderAdvanced.jsx'

require('./css/index.styl')

ReactDOM.render(
  <ShareFolderAdvanced data={undefined} />
  , document.getElementById('content')
)
