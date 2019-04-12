import React from 'react'
import ReactDOM from 'react-dom'
import Agenda from './container/Agenda.jsx'

require('./css/index.styl')

ReactDOM.render(
  <Agenda data={undefined} />
  , document.getElementById('content')
)
