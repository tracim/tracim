import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Redirect } from 'react-router'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import Button from '../component/common/Input/Button.jsx'
import ResetPasswordBtn from '../component/Login/ResetPasswordBtn.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import {
  newFlashMessage,
  setUserConnected,
  setWorkspaceList,
  setWorkspaceListIsOpenInSidebar,
  setContentTypeList,
  setAppList
} from '../action-creator.sync.js'
import {
  getAppList,
  getContentTypeList,
  getWorkspaceList,
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
    const { history, dispatch, t } = this.props
    const { inputLogin, inputPassword, inputRememberMe } = this.state

    const fetchPostUserLogin = await dispatch(postUserLogin(inputLogin.value, inputPassword.value, inputRememberMe))

    if (fetchPostUserLogin.status === 200) {
      const loggedUser = {
        ...fetchPostUserLogin.json,
        logged: true
      }

      dispatch(setUserConnected(loggedUser))

      this.loadAppConfig()
      this.loadWorkspaceList(loggedUser)

      history.push(PAGE.HOME)
    } else if (fetchPostUserLogin.status === 403) {
      dispatch(newFlashMessage(t('Email or password invalid'), 'danger'))
    }
  }

  // @FIXME Côme - 2018/08/22 - this function is duplicated from Tracim.jsx
  loadAppConfig = async () => {
    const { props } = this

    const fetchGetAppList = await props.dispatch(getAppList())
    if (fetchGetAppList.status === 200) props.dispatch(setAppList(fetchGetAppList.json))

    const fetchGetContentTypeList = await props.dispatch(getContentTypeList())
    if (fetchGetContentTypeList.status === 200) props.dispatch(setContentTypeList(fetchGetContentTypeList.json))
  }

  // @FIXME Côme - 2018/08/22 - this function is duplicated from Tracim.jsx
  loadWorkspaceList = async user => {
    const { props } = this

    const fetchGetWorkspaceList = await props.dispatch(getWorkspaceList(user))

    if (fetchGetWorkspaceList.status === 200) {
      props.dispatch(setWorkspaceList(fetchGetWorkspaceList.json))

      const idWorkspaceToOpen = (() =>
        props.match && props.match.params.idws !== undefined && !isNaN(props.match.params.idws)
          ? parseInt(props.match.params.idws)
          : fetchGetWorkspaceList.json[0].workspace_id
      )()

      props.dispatch(setWorkspaceListIsOpenInSidebar(idWorkspaceToOpen, true))
    }
  }

  handleClickForgotPassword = async () => this.props.history.push(PAGE.RESET_PASSWORD)

  render () {
    const { props, state } = this
    if (props.user.logged) return <Redirect to={{pathname: '/'}} />

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
                  <div>
                    <InputGroupText
                      parentClassName='connection__form__groupemail'
                      customClass='mb-3 mt-4'
                      icon='fa-envelope-open-o'
                      type='email'
                      placeHolder={props.t('Email Adress')}
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

                        <ResetPasswordBtn
                          customClass='connection__form__pwforgot'
                          label={props.t('Forgotten password ?')}
                          onClickForgotPasswordBtn={this.handleClickForgotPassword}
                        />
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
                  </div>
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

const mapStateToProps = ({ user }) => ({ user })
export default withRouter(connect(mapStateToProps)(translate()(Login)))
