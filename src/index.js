import React from 'react'
import ReactDOM from 'react-dom'
import PageHtml from './container/PageHtml.jsx'

require('./css/index.styl')

const appInterface = class appInterface {
  renderApp = (domId, app) => {
    return ReactDOM.render(
      <PageHtml app={app} />
      , document.getElementById(domId)
    )
  }

  unountApp = domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

module.exports = appInterface
