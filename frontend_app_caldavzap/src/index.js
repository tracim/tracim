import React from 'react'
import ReactDOM from 'react-dom'
import Caldavzap from './container/Caldavzap.jsx'

// require('./css/index.styl')

const appInterface = {
  name: 'caldavzap',
  isRendered: false,
  renderAppFullscreen: data => {
    return ReactDOM.render(
      <Caldavzap data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

export default appInterface
