import React from 'react'
import ReactDOM from 'react-dom'
import AppFolder from './container/AppFolder.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'AppFolder',
  isRendered: false,
  renderApp: data => {
    return ReactDOM.render(
      <AppFolder data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  hideApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

module.exports = appInterface
