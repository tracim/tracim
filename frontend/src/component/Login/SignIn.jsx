import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import SamlAuthForm from './SamlAuthForm.jsx'
import ClassicLoginAuthForm from './ClassicLoginAuthForm.jsx'
import { IconButton } from 'tracim_frontend_lib'

const LOGIN_FORM_TYPE = {
  CLASSIC: 'classic',
  SAML: 'saml',
  LDAP: 'ldap' // INFO - CH - 2023-11-07 - no form to display for LDAP
}

// INFO - CH - 2023-11-07 - css of this component in Login.styl

const SignIn = props => {
  const [isSamlAuthTypeAvailable, setIsSamlAuthTypeAvailable] = useState(false)
  const [loginFormType, setLoginFormType] = useState(LOGIN_FORM_TYPE.CLASSIC)

  useEffect(() => {
    const newIsSamlAuthTypeAvailable = props.system.config.auth_types &&
      props.system.config.auth_types.includes('saml')

    setIsSamlAuthTypeAvailable(newIsSamlAuthTypeAvailable)

    if (newIsSamlAuthTypeAvailable) setLoginFormType(LOGIN_FORM_TYPE.SAML)
    else setLoginFormType(LOGIN_FORM_TYPE.CLASSIC)
  }, [props.system.config.auth_types])

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

      {loginFormType === LOGIN_FORM_TYPE.CLASSIC && (
        <ClassicLoginAuthForm
          emailNotificationActivated={props.system.config.email_notification_activated}
          isSamlAuthTypeAvailable={isSamlAuthTypeAvailable}
          onClickSamlAuthType={() => setLoginFormType(LOGIN_FORM_TYPE.SAML)}
          onClickSubmit={props.onClickSubmit}
        />
      )}

      {loginFormType === LOGIN_FORM_TYPE.SAML && isSamlAuthTypeAvailable && (
        <SamlAuthForm
          onClickClassicLogin={() => setLoginFormType(LOGIN_FORM_TYPE.CLASSIC)}
          idpList={props.system.config.saml_idp_list}
        />
      )}
    </div>
  )
}

const mapStateToProps = ({ system }) => ({ system })
export default withRouter(connect(mapStateToProps)(translate()(SignIn)))

SignIn.propTypes = {
  onClickSubmit: PropTypes.func.isRequired
}
