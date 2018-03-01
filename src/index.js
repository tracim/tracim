import React from 'react'
import ReactDOM from 'react-dom'
import PageHtml from './container/PageHtml.jsx'

require('./css/index.styl')

const appInterface = {
  renderApp: (domId, data) => {
    return ReactDOM.render(
      <PageHtml file={data} />
      , document.getElementById(domId)
    )
  },
  hideApp: domId => {
    // TODO: should be a display none
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

module.exports = appInterface
