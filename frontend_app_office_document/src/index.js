import React from 'react'
import ReactDOM from 'react-dom'
import PopupCreateOfficeDocument from './container/PopupCreateOfficeDocument.jsx'
import { Router } from 'react-router'

// @TODO make a file that contains all events implemented by this App.
// @todo add this file to appInterface
// @todo app shall make it's customReducer from the events of this app
// so it will be testable by tracim_frontend

require('./css/index.styl')

const appInterface = {
  name: 'office_document',
  isRendered: false,
  // renderAppFeature: data => {
  //   return ReactDOM.render(
  //     <HtmlDocument data={data} />
  //     , document.getElementById(data.config.domContainer)
  //   )
  // },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <Router history={data.config.history}>
        <PopupCreateOfficeDocument data={data} />
      </Router>
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
