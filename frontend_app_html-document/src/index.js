import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import HtmlDocument from './container/HtmlDocument.jsx'
import PopupCreateHtmlDocument from './container/PopupCreateHtmlDocument.jsx'
import { Router } from 'react-router-dom'

require('./css/index.styl')

// FIXME - GB - 2021-05-26 - Both if in the appInterface const are workarounds for the asynchrony problem of the renderAppFeature and unmountApp functions.
// The code of the functions relies on the _reactRootContainer property to know whether the element is a React element or not and
// should be rendered or unmounted (see https://github.com/facebook/react/blob/7841d0695ae4bde9848cf8953baf34d312d0cced/packages/react-dom/src/client/ReactDOMLegacy.js).
// The workaround ensures that a new render is only executed if the unmount of the previous elements has been executed and vice versa.
// More Information: https://github.com/tracim/tracim/issues/4679

const appInterface = {
  name: 'html-document',
  isRendered: false,
  renderAppFeature: data => {
    const element = document.getElementById(data.config.domContainer)
    if (element._reactRootContainer) {
      console.log('HACK (#4679): component is already mounted, waiting for unmount!!', appInterface)
      setTimeout(() => { appInterface.renderAppFeature(data) }, 50)
      return
    }
    return ReactDOM.render(
      <Router history={data.config.history}>
        <HtmlDocument data={data} />
      </Router>
      , element
    )
  },
  unmountApp: domId => {
    const element = document.getElementById(domId)
    if (domId === 'appFeatureContainer' && !element._reactRootContainer) {
      console.log('HACK (#4679): component is not mounted, waiting for mount!!', appInterface)
      setTimeout(() => { appInterface.unmountApp(domId) }, 50)
      return
    }
    return ReactDOM.unmountComponentAtNode(element) // returns bool
  },
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateHtmlDocument data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
