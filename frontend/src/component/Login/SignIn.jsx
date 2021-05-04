import React from 'react'
import { withRouter, Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import InputGroupText from '../common/Input/InputGroupText.jsx'
import Button from '../common/Input/Button.jsx'
import { PAGE } from 'tracim_frontend_lib'

const SignIn = props => {
  return (
    <div className='loginpage__main__wrapper'>
      <h1 className='loginpage__main__title'>{props.t('Sign in')}</h1>
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
          to={isEmailNotificationActivated
            ? PAGE.FORGOT_PASSWORD
            : PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF}
        >
          {props.t('Forgotten password?')}
        </Link>

        <Button
          htmlType='submit'
          bootstrapType=''
          customClass='highlightBtn primaryColorBg primaryColorBgDarkenHover loginpage__main__form__btnsubmit ml-auto'
          label={props.t('Connection')}
        />
      </form>
    </div>
  )
}

export default withRouter(translate()((SignIn)))
