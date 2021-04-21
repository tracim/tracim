import React from 'react'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'
import { Router } from 'react-router-dom'
import File from './container/File.jsx'
import PopupCreateFile from './container/PopupCreateFile.jsx'

require('./css/index.styl')

const appInterface = {
  name: 'file',
  isRendered: false,
  renderAppFeature: (data) => {
    return ReactDOM.render(
      <Router history={data.config.history}>
        <File data={data} />
      </Router>
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateFile data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
