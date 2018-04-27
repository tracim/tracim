import React from 'react'

require('./BtnSwitch.styl')

export const BtnSwitch = props =>
  <div className='btnswitch'>
    <label className='switch nomarginlabel'>
      <input type='checkbox' checked={props.checked} onChange={props.onChange} />
      <span className='slider round' />
    </label>
    <div className='btnswitch__text'>
      { props.checked ? 'Actif' : 'Inactif'}
    </div>
  </div>

export default BtnSwitch
