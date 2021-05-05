import React from 'react'
import { withRouter, Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import InputGroupText from '../common/Input/InputGroupText.jsx'
import { IconButton, PAGE } from 'tracim_frontend_lib'

const CreateAccount = props => {
  return (
    <div className='loginpage__main__wrapper'>
      <h1 className='loginpage__main__title'>{props.t('Create Account')}</h1>
      <span>
        {props.t('Already have an account?')}&nbsp;
        <Link
          onClick={props.onClickSignIn}
          to={PAGE.LOGIN}
        >
          {props.t('Sign in')}
        </Link>
      </span>

      <form onSubmit={props.onClickCreateAccount} noValidate className='loginpage__main__form'>
        <div>{props.t('Full name:')}</div>
        <InputGroupText
          icon='fa-user'
          invalidMsg={props.t('Invalid name')}
          maxLength={512}
          name='name'
          parentClassName='loginpage__main__form__grouplogin'
          type='text'
        />

        <div>{props.t('Email:')}</div>
        <InputGroupText
          icon='fa-envelope'
          invalidMsg={props.t('Invalid email')}
          maxLength={512}
          name='login'
          parentClassName='loginpage__main__form__groupemail'
          type='email'
        />

        <div>{props.t('Password:')}</div>
        <InputGroupText
          icon='fa-lock'
          invalidMsg={props.t('Invalid password')}
          maxLength={512}
          name='password'
          parentClassName='loginpage__main__form__grouppw'
          type='password'
        />

        <IconButton
          customClass='loginpage__main__form__btnsubmit'
          icon='fas fa-user-plus'
          intent='primary'
          mode='light'
          text={props.t('Create account')}
          type='submit'
        />
      </form>
    </div>
  )
}

export default withRouter(translate()((CreateAccount)))
