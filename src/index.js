import React from 'react'
import ReactDOM from 'react-dom'
import PageHtml from './container/PageHtml.jsx'

require('./css/index.styl')

const pluginInterface = {
  renderPlugin: (domId, data) => {
    return ReactDOM.render(
      <PageHtml file={data} />
      , document.getElementById(domId)
    )
  },
  hidePlugin: domId => {
    // TODO: should be a display none
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

module.exports = pluginInterface
