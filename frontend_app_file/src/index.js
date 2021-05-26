import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import { Router } from 'react-router-dom'
import File from './container/File.jsx'
import PopupCreateFile from './container/PopupCreateFile.jsx'

require('./css/index.styl')

// FIXME - GB - 2021-05-26 - Both if in the appInterface const are workarounds for the asynchrony problem of the renderAppFeature and unmountApp functions.
// The code of the functions relies on the _reactRootContainer property to know whether the element is a React element or not and
// should be rendered or unmounted (see https://github.com/facebook/react/blob/7841d0695ae4bde9848cf8953baf34d312d0cced/packages/react-dom/src/client/ReactDOMLegacy.js).
// The workaround ensures that a new render is only executed if the unmount of the previous elements has been executed and vice versa.
// More Information:

const appInterface = {
  name: 'file',
  isRendered: false,
  renderAppFeature: data => {
    const element = document.getElementById(data.config.domContainer)
    if (element._reactRootContainer) {
      console.log('Component is already mounted, waiting for unmount!!', appInterface)
      setTimeout(() => { appInterface.renderAppFeature(data) }, 50)
      return
    }
    return ReactDOM.render(
      <Router history={data.config.history}>
        <File data={data} />
      </Router>
      , element
    )
  },
  unmountApp: domId => {
    const element = document.getElementById(domId)
    if (domId === 'appFeatureContainer' && !element._reactRootContainer) {
      console.log('Component is not mounted, waiting for mount!!', appInterface)
      setTimeout(() => { appInterface.unmountApp(domId) }, 50)
      return
    }
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
