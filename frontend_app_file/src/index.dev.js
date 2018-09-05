import React from 'react'
import ReactDOM from 'react-dom'
import File from './container/File.jsx'
// import PopupCreateFile from './container/PopupCreateFile.jsx'

require('./css/index.styl')

ReactDOM.render(
  <File data={undefined} />
  , document.getElementById('content')
)

// ReactDOM.render(
//   <PopupCreateFile />
//   , document.getElementById('content')
// )
