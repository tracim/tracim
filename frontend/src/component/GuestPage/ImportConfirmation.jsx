import React from 'react'
import { translate } from 'react-i18next'

export const ImportConfirmation = props => {
  return (
    <div className='importConfirmation'>
      <h4>{props.title}</h4>
      <i className='importConfirmation__icon fas fa-fw fa-check' />
      <p>{props.text}</p>
    </div>
  )
}

export default translate()(ImportConfirmation)
