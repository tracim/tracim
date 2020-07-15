import React from 'react'
import ReactDOM from 'react-dom'
import CustomForm from './container/CustomForm.jsx'

require('./css/index.styl')

ReactDOM.render(
  <CustomForm data={undefined} />
  , document.getElementById('content')
)
