import React from 'react'
import ReactDOM from 'react-dom'
import Calendar from './container/Calendar.jsx'

// require('./css/index.styl')

const appInterface = {
  name: 'calendar',
  isRendered: false,
  renderAppFullscreen: data => {
    return ReactDOM.render(
      <Calendar data={data} />
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  }
}

export default appInterface
