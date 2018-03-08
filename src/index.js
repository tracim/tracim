import React from 'react'
import ReactDOM from 'react-dom'
import PageHtml from './container/PageHtml.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'PageHtml',
  isRendered: false,
  renderApp: (domId, data) => {
    return ReactDOM.render(
      <PageHtml app={data} />
      , document.getElementById(domId)
    )
  },
  hideApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

module.exports = appInterface
