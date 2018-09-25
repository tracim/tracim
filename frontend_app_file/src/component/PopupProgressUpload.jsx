import React from 'react'
import { CardPopup } from 'tracim_frontend_lib'

import ProgressBar from './ProgressBar.jsx'

require('./PopupProgressUpload.styl')

export const PopupProgressUpload = props =>
  <CardPopup
    customClass='uploadPopup'
    customHeaderClass=''
    customColor={props.color}
    onClose={() => {}}
    hideCloseBtn
  >
    <div className='uploadPopup__body'>
      <ProgressBar
        percent={props.percent}
        color={props.color}
      />
      <div className='uploadPopup__filename'>{props.filename}</div>
    </div>
  </CardPopup>

export default PopupProgressUpload
