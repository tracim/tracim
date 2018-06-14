import React from 'react'
import ReactDOM from 'react-dom'
import PageHtml from './container/PageHtml.jsx'
import PopupCreatePageHtml from './container/PopupCreatePageHtml.jsx'

require('./css/index.styl')

ReactDOM.render(
  <PopupCreatePageHtml />
  , document.getElementById('content')
)
