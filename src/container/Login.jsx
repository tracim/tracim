import React from 'react'
import { connect } from 'react-redux'
// import { ConnectionForm } from '../component/ConnectionForm.jsx'
import { userLogin } from '../action-creator.async.js'

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
    return (
      <div>{/*
        <div className='loginpage'>

          <section className='loginpage__content'>
            <div className='sidebar'>
              sidebar
            </div>
            <div className='container-fluid contentbody'>
              <div className='loginpage__content__logo'>
                <img src={logoAccueil} />
              </div>

              <div className='row justify-content-center'>
                <div className='col-12 col-sm-11 col-md-8 col-lg-6 col-xl-5'>
                  <div className='loginpage__content__connection card'>
                    <div className='connection__header card-header text-center'>
                      Connexion
                    </div>

                    <div className='card-body'>
                      <form className='connection__form'>
                        <div className='connection__form__groupemail form-group mb-3 mt-4'>
                          <div className='connection__form__groupemail__icon'>
                            <i className='fa fa-fw fa-envelope-open-o' />
                          </div>
                          <input type='email' className='connection__form__groupemail__input form-control' placeholder='Adresse Email' />
                          <div className='connection__form__groupemail__msgerror invalid-feedback'>
                            Invalid email.
                          </div>
                        </div>

                        <div className='connection__form__groupepw form-group'>
                          <div className='connection__form__groupepw__icon'>
                            <i className='fa fa-fw fa-lock' />
                          </div>
                          <input type='password' className='connection__form__groupepw__pw form-control' id='password-co' placeholder='Mot de passe' />
                          <div className='connection__form__groupepw__msgerror invalid-feedback'>
                            Invalid password.
                          </div>
                        </div>

                        <div className='row mt-4 mb-4'>
                          <div className='col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6'>
                            <div className='connection__form__rememberme form-check'>
                              <label className='connection__form__rememberme__label form-check-label'>
                                <input type='checkbox' className='connection__form__rememberme__label__checkbox form-check-input' />
                                Se souvenir de moi
                              </label>
                            </div>
                          </div>

                          <div className='col-12 col-sm-6 col-md-6 col-lg-6 text-sm-right'>
                            <div className='connection__form__pwforgot'>
                              Mot de passe oublié ?
                            </div>
                          </div>
                        </div>

                        <button type='submit' className='connection__form__btnsubmit btn btn-primary'>Connexion</button>
                      </form>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className='footer text-right'>
            <div className='footer__text'>
              Créer votre propre espace de travail collaboratif sur trac.im - Copyright 2013 - 2017
            </div>
            <img className='footer__logo' src={logoFooter} />
          </footer>
        </div> */}
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(Login)
