import React from 'react'
import ReactDOM from 'react-dom'
import Thread from './container/Thread.jsx'
import PopupCreateThread from './container/PopupCreateThread.jsx'

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
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateThread data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

module.exports = appInterface
