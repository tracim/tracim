import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import Gallery from './container/Gallery.jsx'

require('./css/index.styl')

ReactDOM.render(
  <Gallery data={undefined} />
  , document.getElementById('content')
)
