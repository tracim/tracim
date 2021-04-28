import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Thread from './container/Thread.jsx'
import PopupCreateThread from './container/PopupCreateThread.jsx'
import { Router } from 'react-router-dom'

require('./css/index.styl')

const appInterface = {
  name: 'thread',
  isRendered: false,
  renderAppFeature: data => {
    return ReactDOM.render(
      <Router history={data.config.history}>
        <Thread data={data} />
      </Router>
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
