import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import InputGroupText from '../common/Input/InputGroupText'
import { IconButton, PAGE } from 'tracim_frontend_lib'

require('./ClassicLoginAuthForm.styl')

const ClassicLoginAuthForm = props => {
  return (
    <form
      className='classicLoginAuthForm'
      onSubmit={props.onClickSubmit}
      noValidate
    >
      <div>{props.t('Login:')}</div>

      <InputGroupText
        parentClassName='classicLoginAuthForm__groupelogin'
        icon='fa-user'
        type='email'
        placeHolder={props.t('Email address or username')}
        invalidMsg={props.t('Invalid email or username')}
        maxLength={512}
        name='login'
      />

      <div>{props.t('Password:')}</div>

      <InputGroupText
        parentClassName='classicLoginAuthForm__groupepw'
        customClass=''
        icon='fa-lock'
        type='password'
        placeHolder={props.t('Password')}
        invalidMsg={props.t('Invalid password')}
        maxLength={512}
        name='password'
      />

      <Link
        className='classicLoginAuthForm__forgot_password'
        to={props.emailNotificationActivated ? PAGE.FORGOT_PASSWORD : PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF}
      >
        {props.t('Forgotten password?')}
      </Link>

      <div className='classicLoginAuthForm__buttonList'>
        {props.isSamlAuthTypeAvailable && (
          <IconButton
            customClass='classicLoginAuthForm__btnback'
            icon='fas fa-arrow-left'
            intent='link'
            mode='light'
            text={props.t('Back')}
            onClick={props.onClickSamlAuthType}
          />
        )}

        <IconButton
          customClass='classicLoginAuthForm__btnsubmit'
          icon='fas fa-sign-in-alt'
          intent='primary'
          mode='light'
          text={props.t('Connection')}
          type='submit'
          dataCy='connectButton'
        />
      </div>
    </form>
  )
}

export default translate()(ClassicLoginAuthForm)

ClassicLoginAuthForm.propTypes = {
  emailNotificationActivated: PropTypes.bool,
  isSamlAuthTypeAvailable: PropTypes.bool,
  onClickSamlAuthType: PropTypes.func.isRequired,
  onClickSubmit: PropTypes.func.isRequired
}
ClassicLoginAuthForm.defaultProps = {
  emailNotificationActivated: false,
  isSamlAuthTypeAvailable: false,
  onClickSamlAuthType: () => {},
  onClickSubmit: () => {}
}
