import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { store } from './store.js'
import Tracim from './container/Tracim.jsx'

// require('./css/index.styl')

ReactDOM.render(
  <Provider store={store}>
    <Tracim />
  </Provider>
  , document.getElementById('content')
)
