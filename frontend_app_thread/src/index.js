import React from 'react'
import ReactDOM from 'react-dom'
import Thread from './container/Thread.jsx'
import PopupCreateThread from './container/PopupCreateThread.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'thread',
  isRendered: false,
  renderAppFeature: data => {
    return ReactDOM.render(
      <Thread data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateThread data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
