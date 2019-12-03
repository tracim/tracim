import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import Gallery from './container/Gallery.jsx'
import { debug } from './debug.js'
import { Router } from 'react-router'

export const history = require('history').createBrowserHistory()

require('./css/index.styl')

ReactDOM.render(
  <Router history={history}>
    <Gallery data={debug} />
  </Router>
  , document.getElementById('content')
)
