import React from 'react'
import ReactDOM from 'react-dom'
import './i18n.js'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { Avatar, AVATAR_SIZE } from './component/Avatar/Avatar.jsx'

ReactDOM.render(
  <div>
    <Avatar
      apiUrl='/api/user'
      customClass=''
      user={{ publicName: 'testName' }}
      size={AVATAR_SIZE.MEDIUM}
      style={{}}
    />
  </div>
  , document.getElementById('content')
)
