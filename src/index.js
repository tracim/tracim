import React from 'react'
import ReactDOM from 'react-dom'
import PageHtml from './container/PageHtml.jsx'

require('./css/index.styl')

const pluginInterface = {
  renderPlugin: domId => {
    return ReactDOM.render(
      <PageHtml />
      , document.getElementById(domId)
    )
  },
  hidePlugin: domId => {
    // TODO: should be a display none
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

module.exports = pluginInterface
