import React from 'react'
import ReactDOM from 'react-dom'
import { Router } from 'react-router-dom'
import Gallery from './container/Gallery.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'gallery',
  isRendered: false,
  renderAppFullscreen: data => {
    document.getElementById(data.config.domContainer).classList.add('fullWidthFullHeight')

    return ReactDOM.render(
      <Router history={data.config.history}>
        <Gallery data={data} />
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
