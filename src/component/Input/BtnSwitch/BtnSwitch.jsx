import React from 'react'

require('./BtnSwitch.styl')

export const BtnSwitch = props =>
  <div className='btnswitch'>
    <label className='switch nomarginlabel'>
      <input type='checkbox' />
      <span className='slider round' />
    </label>
    <div className='btnswitch__text'>
      On
    </div>
  </div>

export default BtnSwitch
