import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router'
import { translate } from 'react-i18next'
import LoginLogo from '../component/Login/LoginLogo.jsx'
import LoginLogoImg from '../img/logoTracimWhite.svg'
import { postUserLogin } from '../action-creator.async.js'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import InputCheckbox from '../component/common/Input/InputCheckbox.jsx'
import Button from '../component/common/Input/Button.jsx'
import LoginBtnForgotPw from '../component/Login/LoginBtnForgotPw.jsx'
import {
  newFlashMessage,
  setUserConnected
} from '../action-creator.sync.js'
import {PAGE_NAME} from '../helper.js'

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
  handleChangeRememberMe = () => this.setState(prev => ({inputRememberMe: !prev.inputRememberMe}))

  handleClickSubmit = async () => {
    const { history, dispatch, t } = this.props
    const { inputLogin, inputPassword, inputRememberMe } = this.state

    const fetchPostUserLogin = await dispatch(postUserLogin(inputLogin.value, inputPassword.value, inputRememberMe))

    if (fetchPostUserLogin.status === 200) {
      dispatch(setUserConnected({...fetchPostUserLogin.json, logged: true}))
      history.push(PAGE_NAME.HOME)
    } else if (fetchPostUserLogin.status === 400) {
      dispatch(newFlashMessage(t('Login.fail'), 'danger'))
    }
  }

  render () {
    if (this.props.user.logged) return <Redirect to={{pathname: '/'}} />
    else {
      return (
        <section className='loginpage'>
          <div className='container-fluid'>

            <LoginLogo customClass='loginpage__logo' logoSrc={LoginLogoImg} />

            <div className='row justify-content-center'>
              <div className='col-12 col-sm-11 col-md-8 col-lg-6 col-xl-5'>

                <Card customClass='loginpage__connection'>
                  <CardHeader customClass='connection__header text-center'>{'Connexion'}</CardHeader>

                  <CardBody formClass='connection__form'>
                    <div>
                      <InputGroupText
                        parentClassName='connection__form__groupemail'
                        customClass='mb-3 mt-4'
                        icon='fa-envelope-open-o'
                        type='email'
                        placeHolder='Adresse Email'
                        invalidMsg='Email invalide.'
                        isInvalid={this.state.inputLogin.isInvalid}
                        value={this.state.inputLogin.value}
                        onChange={this.handleChangeLogin}
                      />

                      <InputGroupText
                        parentClassName='connection__form__groupepw'
                        customClass=''
                        icon='fa-lock'
                        type='password'
                        placeHolder='Mot de passe'
                        invalidMsg='Mot de passe invalide.'
                        isInvalid={this.state.inputPassword.isInvalid}
                        value={this.state.inputPassword.value}
                        onChange={this.handleChangePassword}
                      />

                      <div className='row mt-4 mb-4'>
                        <div className='col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6'>
                          <InputCheckbox
                            parentClassName='connection__form__rememberme'
                            customClass=''
                            label='Se souvenir de moi'
                            checked={this.state.inputRememberMe}
                            onChange={this.handleChangeRememberMe}
                          />
                        </div>

                        <div className='col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6 text-sm-right'>
                          <LoginBtnForgotPw
                            customClass='connection__form__pwforgot'
                            label='Mot de passe oublié ?'
                          />
                        </div>
                      </div>

                      <Button
                        htmlType='button'
                        bootstrapType='primary'
                        customClass='connection__form__btnsubmit'
                        label='Connexion'
                        onClick={this.handleClickSubmit}
                      />
                    </div>
                  </CardBody>
                </Card>

              </div>
            </div>

          </div>
        </section>
      )
    }
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(Login))
