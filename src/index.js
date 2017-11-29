import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { store } from './store.js'
import Tracim from './container/Tracim.jsx'
import { BrowserRouter } from 'react-router-dom'

require('./css/index.styl')

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <Tracim />
    </BrowserRouter>
  </Provider>
  , document.getElementById('content')
)
