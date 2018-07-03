import React from 'react'
import ReactDOM from 'react-dom'
import HtmlDocument from './container/HtmlDocument.jsx'
import PopupCreateHtmlDocument from './container/PopupCreateHtmlDocument.jsx'

require('./css/index.styl')

/*
  data : {
    loggedUser: {},
    config: {
      name: 'HtmlDocument',
      label: {
        fr: 'Document',
        en: 'Document'
      },
      customClass: 'wsContentHtmlDocument',
      icon: 'fa fa-fw fa-file-text-o',
      color: '#3f52e3',
      domContainer: 'appContainer'
      apiUrl: FETCH_CONFIG.apiUrl,
      mockApiUrl: FETCH_CONFIG.mockApiUrl
    },
    content || folder
  }
*/

const appInterface = {
  name: 'HtmlDocument',
  isRendered: false,
  renderApp: data => {
    return ReactDOM.render(
      <HtmlDocument data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateHtmlDocument data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

module.exports = appInterface
