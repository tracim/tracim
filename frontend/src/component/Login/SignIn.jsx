import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter, Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import InputGroupText from '../common/Input/InputGroupText.jsx'
import { IconButton, PAGE } from 'tracim_frontend_lib'

const SignIn = props => {
  return (
    <div className='loginpage__main__wrapper'>
      <div className='loginpage__main__header'>
        <h1 className='loginpage__main__header__title'>{props.t('Sign in')}</h1>
        {props.system.config.user__self_registration__enabled && (
          <IconButton
            customClass='loginpage__main__header__createButton'
            text={props.t('Create account')}
            icon='fas fa-user-plus'
            onClick={props.onClickCreateAccount}
            intent='secondary'
          />
        )}
      </div>
      <form onSubmit={props.onClickSubmit} noValidate className='loginpage__main__form'>
        <div>{props.t('Login:')}</div>
        <InputGroupText
          parentClassName='loginpage__main__form__groupelogin'
          icon='fa-user'
          type='text'
          placeHolder={props.t('Email address or username')}
          invalidMsg={props.t('Invalid email or username')}
          maxLength={512}
          name='login'
        />
        <div>{props.t('Password:')}</div>
        <InputGroupText
          parentClassName='loginpage__main__form__groupepw'
          customClass=''
          icon='fa-lock'
          type='password'
          placeHolder={props.t('Password')}
          invalidMsg={props.t('Invalid password')}
          maxLength={512}
          name='password'
        />

        <Link
          className='loginpage__main__form__forgot_password'
          to={props.system.config.email_notification_activated
            ? PAGE.FORGOT_PASSWORD
            : PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF}
        >
          {props.t('Forgotten password?')}
        </Link>

        <IconButton
          customClass='loginpage__main__form__btnsubmit'
          icon='fas fa-sign-in-alt'
          intent='primary'
          mode='light'
          text={props.t('Connection')}
          type='submit'
        />
      </form>
    </div>
  )
}

const mapStateToProps = ({ system }) => ({ system })
export default withRouter(connect(mapStateToProps)(translate()(SignIn)))

SignIn.propTypes = {
  onClickSubmit: PropTypes.func.isRequired
}
