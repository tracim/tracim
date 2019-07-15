import React from 'react'

export const ConfirmationPage = props => {
  return (
    <div className='confirmationPage'>
      <h4>Thank you, your import is finished</h4>
      <i className='confirmationPage__icon fa fa-fw fa-check-square-o' />
      <p>You can now close this page, your recipient will receive the notification of your import.</p>
    </div>
  )
}

export default ConfirmationPage
