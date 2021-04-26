import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Redirect, Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../util/appFactory.js'
import i18n from '../util/i18n.js'
import * as Cookies from 'js-cookie'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import Button from '../component/common/Input/Button.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import {
  connectUser,
  loadConfig
} from '../util/load.js'
import {
  CUSTOM_EVENT,
  checkEmailValidity,
  PAGE
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  resetBreadcrumbs,
  setUserLang,
  setHeadTitle
} from '../action-creator.sync.js'
import {
  postUserLogin
} from '../action-creator.async.js'
import { COOKIE_FRONTEND, WELCOME_ELEMENT_ID } from '../util/helper.js'

const qs = require('query-string')

class Login extends React.Component {
  constructor (props) {
    super(props)

    // NOTE - SG - 2021-03-23 - the welcome DOM element is defined
    // statically in the loaded HTML page so that its content can be parsed by
    // search engines' robots.
    // A copy of its html is made in order to display it in this component (see render()).
    // The original welcome element is hidden unconditionally in Tracim.jsx
    const welcomeElement = document.getElementById(WELCOME_ELEMENT_ID)
    this.state = {
      inputRememberMe: false,
      welcomeHtml: welcomeElement.innerHTML
    }

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        this.setHeadTitle()
        break
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
  }

  async componentDidMount () {
    const { props } = this

    this.setHeadTitle()

    props.dispatch(resetBreadcrumbs())

    const defaultLangCookie = Cookies.get(COOKIE_FRONTEND.DEFAULT_LANGUAGE)

    if (defaultLangCookie && defaultLangCookie !== 'null') {
      i18n.changeLanguage(defaultLangCookie)
      props.dispatch(setUserLang(defaultLangCookie))
    }

    const query = qs.parse(props.location.search)
    if (query.dc && query.dc === '1') {
      props.dispatch(newFlashMessage(props.t('You have been disconnected, please login again', 'warning')))
      props.history.push(props.location.pathname)
    }

    await loadConfig(props.dispatch)
  }

  setHeadTitle = () => {
    const { props } = this
    props.dispatch(setHeadTitle(props.t('Login')))
  }

  handleChangeRememberMe = e => {
    e.preventDefault()
    e.stopPropagation()
    this.setState(prev => ({ inputRememberMe: !prev.inputRememberMe }))
  }

  handleClickSubmit = async (event) => {
    const { props, state } = this

    event.preventDefault()

    const { login, password } = event.target

    if (login.value === '' || password.value === '') {
      props.dispatch(newFlashMessage(props.t('Please enter a login and a password'), 'warning'))
      return
    }

    const credentials = {
      ...(checkEmailValidity(login.value) ? { email: login.value } : { username: login.value }),
      password: password.value
    }

    const fetchPostUserLogin = await props.dispatch(postUserLogin(credentials, state.inputRememberMe))

    switch (fetchPostUserLogin.status) {
      case 200: {
        connectUser(fetchPostUserLogin.json, props.user, props.dispatch)

        props.dispatchCustomEvent(CUSTOM_EVENT.USER_CONNECTED, fetchPostUserLogin.json)

        if (props.system.redirectLogin !== '') {
          props.history.push(props.system.redirectLogin)
          return
        }

        props.history.push(PAGE.HOME)
        break
      }
      case 400:
        switch (fetchPostUserLogin.json.code) {
          case 2001: props.dispatch(newFlashMessage(props.t('Invalid email or username'), 'warning')); break
          default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning')); break
        }
        break
      case 403: props.dispatch(newFlashMessage(props.t('Invalid credentials'), 'warning')); break
      default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning')); break
    }
  }

  render () {
    const { props, state } = this
    if (props.user.logged) return <Redirect to={{ pathname: '/ui' }} />

    return (
      <div className='loginpage'>
        <div className='loginpage__welcome' dangerouslySetInnerHTML={{ __html: state.welcomeHtml }} />
        <section className='loginpage__main'>
          <div className='loginpage__main__wrapper'>
            <h1 className='loginpage__main__title'>{props.t('Sign in')}</h1>
            <form onSubmit={this.handleClickSubmit} noValidate className='loginpage__main__form'>
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

              <Button
                htmlType='submit'
                bootstrapType=''
                customClass='highlightBtn primaryColorBg primaryColorBgDarkenHover loginpage__main__form__btnsubmit ml-auto'
                label={props.t('Connection')}
              />
            </form>
          </div>
          <FooterLogin />
        </section>
      </div>
    )
  }
}

const mapStateToProps = ({ user, system, breadcrumbs, tlm }) => ({ user, system, breadcrumbs, tlm })
export default withRouter(connect(mapStateToProps)(translate()(appFactory(Login))))
