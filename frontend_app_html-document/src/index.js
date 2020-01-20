import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import HtmlDocument from './container/HtmlDocument.jsx'
import PopupCreateHtmlDocument from './container/PopupCreateHtmlDocument.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'html-document',
  isRendered: false,
  renderAppFeature: data => {
    return ReactDOM.render(
      <HtmlDocument data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateHtmlDocument data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
