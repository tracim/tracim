import React from 'react'
import ReactDOM from 'react-dom'
import Caldavzap from './container/Caldavzap.jsx'

require('./css/index.styl')

ReactDOM.render(
  <Caldavzap data={undefined} />
  , document.getElementById('content')
)
