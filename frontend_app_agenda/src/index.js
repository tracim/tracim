import React from 'react'
import ReactDOM from 'react-dom'
import { Router } from 'react-router-dom'
import Agenda from './container/Agenda.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'agenda',
  isRendered: false,
  renderAppFullscreen: data => {
    document.getElementById(data.config.domContainer).classList.add('fullWidthFullHeight')

    return ReactDOM.render(
      <Router history={data.config.history}>
        <Agenda data={data} />
      </Router>
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    document.getElementById(domId).classList.remove('fullWidthFullHeight')

    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

export default appInterface
