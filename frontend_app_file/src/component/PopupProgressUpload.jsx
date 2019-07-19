import React from 'react'
import { CardPopup, ProgressBar } from 'tracim_frontend_lib'

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
