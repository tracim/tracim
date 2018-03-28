import React from 'react'
import ReactDOM from 'react-dom'
import Thread from './container/Thread.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'Thread',
  isRendered: false,
  renderApp: data => {
    return ReactDOM.render(
      <Thread data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  hideApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

module.exports = appInterface
