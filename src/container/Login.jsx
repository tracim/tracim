import React from 'react'
import { connect } from 'react-redux'
import LoginLogo from '../component/Login/LoginLogo.jsx'
import LoginLogoImg from '../img/logoTracimWhite.svg'
import { userLogin } from '../action-creator.async.js'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import InputCheckbox from '../component/common/Input/InputCheckbox.jsx'
import Button from '../component/common/Input/Button.jsx'
import LoginBtnForgotPw from '../component/Login/LoginBtnForgotPw.jsx'

class Login extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      inputLogin: '',
      inputPassword: ''
    }
  }

  handleChangeLogin = e => this.setState({inputLogin: e.target.value})
  handleChangePassword = e => this.setState({inputPassword: e.target.value})

  handleClickSubmit = () => this.props.dispatch(userLogin(this.state.inputLogin, this.state.inputPassword))

  render () {
    // const { user } = this.props
    // return (
    //   <div>
    //     <ConnectionForm
    //       user={user}
    //       onChangeLogin={this.handleChangeLogin}
    //       onChangePassword={this.handleChangePassword}
    //       onClickSubmit={this.handleClickSubmit}
    //     />
    //   </div>
    // )
    const LoginWrapper = props => (
      <section className='loginpage'>
        <div className='container-fluid'>
          {props.children}
        </div>
      </section>
    )
    const LoginCardWrapper = props => (
      <div className='row justify-content-center'>
        <div className='col-12 col-sm-11 col-md-8 col-lg-6 col-xl-5'>
          {props.children}
        </div>
      </div>
    )
    const LoginCardAction = props => (
      <div className='row mt-4 mb-4'>
        <div className='col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6'>
          {props.children[0]}
        </div>
        <div className='col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6 text-sm-right'>
          {props.children[1]}
        </div>
      </div>
    )
    return (
      <LoginWrapper>
        <LoginLogo customClass='loginpage__logo' logoSrc={LoginLogoImg} />

        <LoginCardWrapper>
          <Card customClass='loginpage__connection'>
            <CardHeader customClass='connection__header text-center'>{'Connexion'}</CardHeader>

            <CardBody formClass='connection__form'>
              <InputGroupText
                parentClassName='connection__form__groupemail'
                customClass='mb-3 mt-4'
                icon='fa-envelope-open-o'
                type='email'
                placeHolder='Adresse Email'
                invalidMsg='Email invalide.'
                onChange={this.handleChangeLogin}
              />

              <InputGroupText
                parentClassName='connection__form__groupepw'
                customClass=''
                icon='fa-lock'
                type='password'
                placeHolder='Mot de passe'
                invalidMsg='Mot de passe invalide.'
                onChange={this.handleChangePassword}
              />

              <LoginCardAction>
                <InputCheckbox
                  parentClassName='connection__form__rememberme'
                  customClass=''
                  label='Se souvenir de moi'
                />

                <LoginBtnForgotPw
                  customClass='connection__form__pwforgot'
                  label='Mot de passe oublié ?'
                />
              </LoginCardAction>

              <Button
                htmlType='button'
                bootstrapType='primary'
                customClass='connection__form__btnsubmit'
                label='Connexion'
                onClick={this.handleClickSubmit}
              />
            </CardBody>
          </Card>
        </LoginCardWrapper>
      </LoginWrapper>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(Login)
