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
  component: null,

  renderAppFeature: data => {
    const element = document.getElementById(data.config.domContainer)
    if (element._reactRootContainer) {
      console.log('Component is already mounted, waiting for unmount!!', appInterface)
      setTimeout(() => { appInterface.renderAppFeature(data) }, 50)
      return
    }

    const component = ReactDOM.render(
      <Router history={data.config.history}>
        <Thread data={data} />
      </Router>
      , element
    )
    appInterface.component = component
    return appInterface.component
  },
  unmountApp: domId => {
    const element = document.getElementById(domId)
    if (domId === 'appFeatureContainer' && !element._reactRootContainer) {
      console.log('Component is not mounted, waiting for mount!!', appInterface)
      setTimeout(() => { appInterface.unmountApp(domId) }, 50)
      return
    }
    appInterface.component = null
    return ReactDOM.unmountComponentAtNode(element) // returns bool
  },
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateThread data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
