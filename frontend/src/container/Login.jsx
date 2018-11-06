import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Redirect } from 'react-router'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import * as Cookies from 'js-cookie'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import Button from '../component/common/Input/Button.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import {
  newFlashMessage,
  setUserConnected,
  setWorkspaceList,
  setContentTypeList,
  setAppList,
  setConfig
} from '../action-creator.sync.js'
import {
  getAppList,
  getConfig,
  getContentTypeList,
  getMyselfWorkspaceList,
  postUserLogin
} from '../action-creator.async.js'
import { PAGE } from '../helper.js'
import { Checkbox } from 'tracim_frontend_lib'

const qs = require('query-string')

class Login extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      inputLogin: {
        value: '',
        isInvalid: false
      },
      inputPassword: {
        value: '',
        isInvalid: false
      },
      inputRememberMe: false
    }
  }

  componentDidMount () {
    const { props } = this

    const query = qs.parse(props.location.search)
    if (query.dc && query.dc === '1') props.dispatch(newFlashMessage(props.t('You have been disconnected, please login again', 'warning')))
  }

  handleChangeLogin = e => this.setState({inputLogin: {...this.state.inputLogin, value: e.target.value}})
  handleChangePassword = e => this.setState({inputPassword: {...this.state.inputPassword, value: e.target.value}})
  handleChangeRememberMe = e => {
    e.preventDefault()
    e.stopPropagation()
    this.setState(prev => ({inputRememberMe: !prev.inputRememberMe}))
  }

  handleInputKeyDown = e => e.key === 'Enter' && this.handleClickSubmit()

  handleClickSubmit = async () => {
    const { props, state } = this

    if (state.inputLogin.value === '' || state.inputPassword.value === '') {
      props.dispatch(newFlashMessage(props.t('Please enter a login and a password'), 'warning'))
      return
    }

    const fetchPostUserLogin = await props.dispatch(postUserLogin(state.inputLogin.value, state.inputPassword.value, state.inputRememberMe))

    switch (fetchPostUserLogin.status) {
      case 200:
        const loggedUser = {
          ...fetchPostUserLogin.json,
          logged: true
        }

        Cookies.set('lastConnection', '1', {expires: 180})
        props.dispatch(setUserConnected(loggedUser))
        i18n.changeLanguage(loggedUser.lang)

        this.loadAppConfig()
        this.loadWorkspaceList()

        if (props.system.redirectLogin !== '') {
          props.history.push(props.system.redirectLogin)
          return
        }

        props.history.push(PAGE.HOME)
        break
      case 400:
        switch (fetchPostUserLogin.json.code) {
          case 2001: props.dispatch(newFlashMessage(props.t('Not a valid email'), 'warning')); break
          default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning')); break
        }
        break
      case 403: props.dispatch(newFlashMessage(props.t('Email or password invalid'), 'warning')); break
      default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning')); break
    }
  }

  // @FIXME Côme - 2018/08/22 - this function is duplicated from Tracim.jsx
  loadAppConfig = async () => {
    const { props } = this

    const fetchGetConfig = await props.dispatch(getConfig())
    if (fetchGetConfig.status === 200) props.dispatch(setConfig(fetchGetConfig.json))

    const fetchGetAppList = await props.dispatch(getAppList())
    if (fetchGetAppList.status === 200) props.dispatch(setAppList(fetchGetAppList.json))

    const fetchGetContentTypeList = await props.dispatch(getContentTypeList())
    if (fetchGetContentTypeList.status === 200) props.dispatch(setContentTypeList(fetchGetContentTypeList.json))
  }

  loadWorkspaceList = async () => {
    const { props } = this
    const fetchGetWorkspaceList = await props.dispatch(getMyselfWorkspaceList())
    if (fetchGetWorkspaceList.status === 200) props.dispatch(setWorkspaceList(fetchGetWorkspaceList.json))
  }

  handleClickForgotPassword = async () => this.props.history.push(PAGE.FORGOT_PASSWORD)

  render () {
    const { props, state } = this
    if (props.user.logged) return <Redirect to={{pathname: '/ui'}} />

    return (
      <section className='unLoggedPage loginpage primaryColorBg'>
        <div className='container-fluid'>
          { /*
            AC - 11/09/2018 - disable the logo to leave more space for the login form
            <LoginLogo
              customClass='loginpage__logo'
              logoSrc={LoginLogoImg}
            />
          */ }

          <div className='row justify-content-center'>
            <div className='col-12 col-sm-11 col-md-8 col-lg-6 col-xl-4'>
              <Card customClass='loginpage__connection'>
                <CardHeader customClass='connection__header primaryColorBgLighten text-center'>
                  {props.t('Connection')}
                </CardHeader>

                <CardBody formClass='connection__form'>
                  <form>
                    <InputGroupText
                      parentClassName='connection__form__groupemail'
                      customClass='mb-3 mt-4'
                      icon='fa-envelope-open-o'
                      type='email'
                      placeHolder={props.t('Email Address')}
                      invalidMsg='Email invalide.'
                      isInvalid={state.inputLogin.isInvalid}
                      value={state.inputLogin.value}
                      onChange={this.handleChangeLogin}
                      onKeyDown={this.handleInputKeyDown}
                      maxLength={512}
                    />

                    <InputGroupText
                      parentClassName='connection__form__groupepw'
                      customClass=''
                      icon='fa-lock'
                      type='password'
                      placeHolder={props.t('Password')}
                      invalidMsg='Mot de passe invalide.'
                      isInvalid={state.inputPassword.isInvalid}
                      value={state.inputPassword.value}
                      onChange={this.handleChangePassword}
                      onKeyDown={this.handleInputKeyDown}
                      maxLength={512}
                    />

                    <div className='row mt-4 mb-4'>
                      <div className='col-12 col-sm-6'>
                        <div
                          className='connection__form__rememberme'
                          onClick={this.handleChangeRememberMe}
                          style={{'display': 'none'}}
                          // AC - 10/09/2018 - not included in v2.0 roadmap
                        >
                          <Checkbox
                            name='inputRememberMe'
                            checked={state.inputRememberMe}
                            onClickCheckbox={() => {}}
                          />
                          {props.t('Remember me')}
                        </div>

                        <div
                          className='connection__form__pwforgot'
                          onClick={this.handleClickForgotPassword}
                        >
                          {props.t('Forgotten password ?')}
                        </div>
                      </div>

                      <div className='col-12 col-sm-6 d-flex align-items-end'>
                        <Button
                          htmlType='button'
                          bootstrapType='primary'
                          customClass='btnSubmit connection__form__btnsubmit ml-auto'
                          label={props.t('Connection')}
                          onClick={this.handleClickSubmit}
                        />
                      </div>
                    </div>
                  </form>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        <FooterLogin />
      </section>
    )
  }
}

const mapStateToProps = ({ user, system }) => ({ user, system })
export default withRouter(connect(mapStateToProps)(translate()(Login)))
