import React from 'react'
import ReactDOM from 'react-dom'
import Thread from './container/Thread.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'Thread',
  isRendered: false,
  renderApp: (domId, data) => {
    return ReactDOM.render(
      <Thread file={data} />
      , document.getElementById(domId)
    )
  },
  hideApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

module.exports = appInterface
