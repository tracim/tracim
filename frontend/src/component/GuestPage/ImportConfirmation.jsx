import React from 'react'
import { withTranslation } from 'react-i18next'

export const ImportConfirmation = props => {
  return (
    <div className='importConfirmation'>
      <h4>{props.t('Thank you, your import is finished!')}</h4>
      <i className='importConfirmation__icon fa fa-fw fa-check' />
      <p>{props.t('You can now close this page, your recipient will receive the notification of your import.')}</p>
    </div>
  )
}

export default withTranslation()(ImportConfirmation)
