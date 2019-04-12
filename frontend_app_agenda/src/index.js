import React from 'react'
import ReactDOM from 'react-dom'
import Agenda from './container/Agenda.jsx'

// require('./css/index.styl')

const appInterface = {
  name: 'calendar',
  isRendered: false,
  renderAppFullscreen: data => {
    return ReactDOM.render(
      <Agenda data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

export default appInterface
