import React from 'react'
import ReactDOM from 'react-dom'
import PageHtml from './container/PageHtml.jsx'
import PopupCreatePageHtml from './container/PopupCreatePageHtml.jsx'

require('./css/index.styl')

/* data : {
  loggedUser: {},
  config: {
    name: 'PageHtml',
    label: {
      fr: 'Document',
      en: 'Document'
    },
    customClass: 'wsContentPageHtml',
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
  },
  renderPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreatePageHtml data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

module.exports = appInterface
