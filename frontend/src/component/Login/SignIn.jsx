import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter, Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import InputGroupText from '../common/Input/InputGroupText.jsx'
import { IconButton, PAGE } from 'tracim_frontend_lib'

const SignIn = props => {
  const [authTypePassword, setAuthTypePassword] = React.useState(false)

  const hasSaml = props.system.config.auth_types && props.system.config.auth_types.includes('saml')

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
            dataCy='showCreateAccountFormButton'
          />
        )}
      </div>
      {!authTypePassword && hasSaml ? (
        <div className='loginpage__main__form'>
          <div>{props.t('Choose a login method:')}</div>
          <li>
            <Link
              className='loginpage__main__form__forgot_password'
              onClick={() => setAuthTypePassword(true)}
            >
              {props.t('Classic login')}
            </Link>
          </li>
          {props.system.config.saml_idp_list.map((samlIdp) =>
            <li key={samlIdp.identifier}>
              <a
                className='loginpage__main__form__saml'
                href={'/saml/sso?target=' + encodeURIComponent(samlIdp.identifier)}
                rel='noopener noreferrer'
              >
                <img
                  className='loginpage__main__form__saml__logo'
                  src={samlIdp.logo_url}
                  alt={samlIdp.displayed_name}
                />
                <span className='loginpage__main__form__saml__link'>
                  {samlIdp.displayed_name}
                </span>
              </a>
            </li>
          )}
        </div>
      ) : (
        <form onSubmit={props.onClickSubmit} noValidate className='loginpage__main__form'>
          <div>{props.t('Login:')}</div>
          <InputGroupText
            parentClassName='loginpage__main__form__groupelogin'
            icon='fa-user'
            type='email'
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
            dataCy='connectButton'
          />

          {hasSaml && (
            <IconButton
              customClass='loginpage__main__form__btnback'
              icon='fas fa-sign-in-alt'
              intent='primary'
              mode='light'
              text={props.t('Back')}
              onClick={() => setAuthTypePassword(false)}
            />
          )}
        </form>
      )}
    </div>
  )
}

const mapStateToProps = ({ system }) => ({ system })
export default withRouter(connect(mapStateToProps)(translate()(SignIn)))

SignIn.propTypes = {
  onClickSubmit: PropTypes.func.isRequired
}
