import React from 'react'
import { CardPopup } from '../component/CardPopup/CardPopup.jsx'
import { ProgressBar } from '../component/ProgressBar/ProgressBar.jsx'

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
        backgroundColor={props.color}
      />
      <div className='uploadPopup__filename'>{props.filename}</div>
    </div>
  </CardPopup>

export default PopupProgressUpload
