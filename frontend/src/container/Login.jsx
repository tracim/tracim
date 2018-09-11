import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Redirect } from 'react-router'
import { translate } from 'react-i18next'
import LoginLogo from '../component/Login/LoginLogo.jsx'
import LoginLogoImg from '../img/logoTracimWhite.svg'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import Button from '../component/common/Input/Button.jsx'
import LoginBtnForgotPw from '../component/Login/LoginBtnForgotPw.jsx'
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

  handleChangeLogin = e => this.setState({inputLogin: {...this.state.inputLogin, value: e.target.value}})
  handleChangePassword = e => this.setState({inputPassword: {...this.state.inputPassword, value: e.target.value}})
  handleChangeRememberMe = e => {
    e.preventDefault()
    e.stopPropagation()
    this.setState(prev => ({inputRememberMe: !prev.inputRememberMe}))
  }

  handleInputKeyPress = e => e.key === 'Enter' && this.handleClickSubmit()

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

      this.loadAppConfig(loggedUser)
      this.loadWorkspaceList(loggedUser)

      history.push(PAGE.WORKSPACE.ROOT)
    } else if (fetchPostUserLogin.status === 403) {
      dispatch(newFlashMessage(t('Email or password invalid'), 'danger'))
    }
  }

  // @FIXME Côme - 2018/08/22 - this function is duplicated from Tracim.jsx
  loadAppConfig = async user => {
    const { props } = this

    const fetchGetAppList = await props.dispatch(getAppList(user))
    if (fetchGetAppList.status === 200) props.dispatch(setAppList(fetchGetAppList.json))

    const fetchGetContentTypeList = await props.dispatch(getContentTypeList(user))
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

  render () {
    if (this.props.user.logged) return <Redirect to={{pathname: '/'}} />
    else {
      return (
        <section className='loginpage primaryColorBg'>
          <div className='container-fluid'>

            <LoginLogo customClass='loginpage__logo' logoSrc={LoginLogoImg} />

            <div className='row justify-content-center'>
              <div className='col-12 col-sm-11 col-md-8 col-lg-6 col-xl-4'>

                <Card customClass='loginpage__connection'>
                  <CardHeader customClass='connection__header primaryColorBgLighten text-center'>{this.props.t('Connection')}</CardHeader>

                  <CardBody formClass='connection__form'>
                    <div>
                      <InputGroupText
                        parentClassName='connection__form__groupemail'
                        customClass='mb-3 mt-4'
                        icon='fa-envelope-open-o'
                        type='email'
                        placeHolder={this.props.t('Email Adress')}
                        invalidMsg='Email invalide.'
                        isInvalid={this.state.inputLogin.isInvalid}
                        value={this.state.inputLogin.value}
                        onChange={this.handleChangeLogin}
                        onKeyPress={this.handleInputKeyPress}
                      />

                      <InputGroupText
                        parentClassName='connection__form__groupepw'
                        customClass=''
                        icon='fa-lock'
                        type='password'
                        placeHolder={this.props.t('Password')}
                        invalidMsg='Mot de passe invalide.'
                        isInvalid={this.state.inputPassword.isInvalid}
                        value={this.state.inputPassword.value}
                        onChange={this.handleChangePassword}
                        onKeyPress={this.handleInputKeyPress}
                      />

                      <div className='row mt-4 mb-4'>
                        <div className='col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6'>
                          <div
                            className='connection__form__rememberme'
                            onClick={this.handleChangeRememberMe}
                            style={{'display': 'none'}}
                            // AC - 10/09/2018 - not included in v2.0 roadmap
                          >
                            <Checkbox
                              name='inputRememberMe'
                              checked={this.state.inputRememberMe}
                              onClickCheckbox={() => {}}
                            />
                            Se souvenir de moi
                          </div>

                          <LoginBtnForgotPw
                            customClass='connection__form__pwforgot'
                            label={this.props.t('Forgotten password ?')}
                          />
                        </div>

                        <div className='col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6 d-flex align-items-end'>
                          <Button
                            htmlType='button'
                            bootstrapType='primary'
                            customClass='connection__form__btnsubmit ml-auto'
                            label={this.props.t('Connection')}
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

          <footer className='loginpage__footer'>
            <div className='loginpage__footer__text d-flex align-items-center flex wrap'>
            copyright © 2013 - 2018 <a href='http://www.tracim.fr/' target='_blank' className='ml-3'>tracim.fr</a>
            </div>
          </footer>

        </section>
      )
    }
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default withRouter(connect(mapStateToProps)(translate()(Login)))
