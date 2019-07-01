import React from 'react'
import ReactDOM from 'react-dom'
import HtmlDocument from './container/CustomForm.jsx'
// import PopupCreateHtmlDocument from './container/PopupCreateCustomForm.jsx'

require('./css/index.styl')

ReactDOM.render(
  <HtmlDocument data={undefined} />
  , document.getElementById('content')
)

// ReactDOM.render(
//   <PopupCreateHtmlDocument />
//   , document.getElementById('content')
// )
