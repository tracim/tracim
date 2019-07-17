import React from 'react'
import { translate } from 'react-i18next'

export const ConfirmationPage = props => {
  return (
    <div className='confirmationPage'>
      <h4>{props.t('Thank you, your import is finished!')}</h4>
      <i className='confirmationPage__icon fa fa-fw fa-check' />
      <p>{props.t('You can now close this page, your recipient will receive the notification of your import.')}</p>
    </div>
  )
}

export default translate()(ConfirmationPage)
