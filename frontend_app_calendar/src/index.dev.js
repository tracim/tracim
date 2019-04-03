import React from 'react'
import ReactDOM from 'react-dom'
import Calendar from './container/Calendar.jsx'

require('./css/index.styl')

ReactDOM.render(
  <Calendar data={undefined} />
  , document.getElementById('content')
)
