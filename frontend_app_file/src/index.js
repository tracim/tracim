import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import { Router } from 'react-router-dom'
import File from './container/File.jsx'
import PopupCreateFile from './container/PopupCreateFile.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'file',
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
        <File data={data} />
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
      <PopupCreateFile data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
