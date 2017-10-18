import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { store } from './store.js'

// require('./css/index.styl')

const Temp = class Temp extends React.Component {
  render () {
    return (<div>It Works</div>)
  }
}

ReactDOM.render(
  <Provider store={store}>
    <Temp />
  </Provider>
  , document.getElementById('content')
)
