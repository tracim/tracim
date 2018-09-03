import React from 'react'
import ReactDOM from 'react-dom'
import File from './container/File.jsx'
import { fakeLogin } from './helper.js'
// import PopupCreateFile from './container/PopupCreateFile.jsx'

require('./css/index.styl')

;(async () => {
  const rez = await fakeLogin()

  if (rez) {
    ReactDOM.render(
      <File data={undefined} />
      , document.getElementById('content')
    )

    // ReactDOM.render(
    //   <PopupCreateFile />
    //   , document.getElementById('content')
    // )
  }
  else console.log('failed to login. rez: ', rez)
})()



