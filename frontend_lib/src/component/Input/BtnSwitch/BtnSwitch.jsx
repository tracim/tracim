import React from 'react'
import { translate } from 'react-i18next'

require('./BtnSwitch.styl')

export const BtnSwitch = props =>
  <div className='btnswitch'>
    <label className='switch nomarginlabel' onClick={e => {
      e.preventDefault()
      e.stopPropagation()
      props.onChange(e)
    }}>
      <input type='checkbox' checked={props.checked} onChange={e => {
        e.preventDefault()
        e.stopPropagation()
        props.onChange(e)
      }} />
      <span className='slider round' />
    </label>
    <div className='btnswitch__text'>
      { props.checked ? props.t('') : props.t('inactive') }
    </div>
  </div>

export default translate()(BtnSwitch)
