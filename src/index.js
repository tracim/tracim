import React from 'react'
import ReactDOM from 'react-dom'
import PageHtml from './container/PageHtml.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'PageHtml',
  isRendered: false,
  renderApp: data => {
    return ReactDOM.render(
      <PageHtml data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  hideApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

module.exports = appInterface
