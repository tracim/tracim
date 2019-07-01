import React from 'react'
import ReactDOM from 'react-dom'
import FormGenerator from './container/CustomForm.jsx'
import PopupCreateFormGenerator from './container/PopupCreateCustomForm.jsx'
// @TODO make a file that contains all events implemented by this App.
// @todo add this file to appInterface
// @todo app shall make it's customReducer from the events of this app
// so it will be testable by tracim_frontend

require('./css/index.styl')

const appInterface = {
  name: 'custom-form',
  isRendered: false,
  renderAppFeature: data => {
    return ReactDOM.render(
      <FormGenerator data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateFormGenerator data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
