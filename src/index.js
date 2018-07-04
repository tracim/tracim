import React from 'react'
import ReactDOM from 'react-dom'
import HtmlDocument from './container/HtmlDocument.jsx'
import PopupCreateHtmlDocument from './container/PopupCreateHtmlDocument.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'HtmlDocument',
  isRendered: false,
  renderApp: data => {
    return ReactDOM.render(
      <HtmlDocument data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateHtmlDocument data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

module.exports = appInterface
