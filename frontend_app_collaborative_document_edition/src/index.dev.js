import React from 'react'
import ReactDOM from 'react-dom'
import PopupCreateOfficeDocument from './container/PopupCreateOfficeDocument.jsx'
import { Router } from 'react-router'

require('./css/index.styl')

export const history = require('history').createBrowserHistory()

ReactDOM.render(
  <Router history={history}>
    <PopupCreateOfficeDocument />
  </Router>
  , document.getElementById('content')
)
