import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import Button from '../component/common/Input/Button.jsx'
import { postForgotPassword } from '../action-creator.async.js'
import { newFlashMessage } from '../action-creator.sync.js'
import { PAGE } from '../helper.js'

export class ForgotPassword extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      backupEmail: {
        value: '',
        isInvalid: false
      }
    }
  }

  handleInputKeyDown = e => e.key === 'Enter' && this.handleClickSubmit()

  handleChangeBackupEmail = e => this.setState({backupEmail: {value: e.target.value, isInvalid: false}})

  handleClickCancel = () => this.props.history.push(PAGE.LOGIN)

  handleClickSubmit = async () => {
    const { props, state } = this

    const fetchPostResetPassword = await props.dispatch(postForgotPassword(state.backupEmail.value))
    switch (fetchPostResetPassword.status) {
      case 204: props.dispatch(newFlashMessage(props.t("Email sent, don't forget to check your spam"), 'info')); break
      case 400:
        switch (fetchPostResetPassword.json.code) {
          case 1001: props.dispatch(newFlashMessage(props.t('Unknown email'), 'warning')); break
          case 2001: props.dispatch(newFlashMessage(props.t('Not a valid email'), 'warning')); break
          case 2046: props.dispatch(newFlashMessage(props.t('Cannot reset password while email are disabled, please contact an administrator'), 'warning')); break
          default: props.dispatch(newFlashMessage(props.t('An error has happened, please try again'), 'warning')); break
        }
        break
      default: props.dispatch(newFlashMessage(props.t('An error has happened, please try again' +
        ''), 'warning'))
    }
  }

  render () {
    const { props, state } = this

    return (
      <section className='unLoggedPage forgotpassword primaryColorBg'>
        <div className='container-fluid'>
          <div className='row justify-content-center'>
            <div className='col-12 col-sm-11 col-md-8 col-lg-6 col-xl-4'>
              <Card customClass='forgotpassword__card'>
                <CardHeader customClass='forgotpassword__card__header primaryColorBgLighten text-center'>
                  {props.t('Forgot password')}
                </CardHeader>

                <CardBody formClass='forgotpassword__card__body'>
                  <div>
                    <div className='forgotpassword__card__body__title'>
                      {props.t('Did you forget your password ?')}
                    </div>

                    <InputGroupText
                      parentClassName='forgotpassword__card__body__groupemail'
                      customClass=''
                      icon='fa-envelope-open-o'
                      type='email'
                      placeHolder={props.t('Email')}
                      invalidMsg='Email invalide.'
                      // isInvalid={this.state.inputLogin.isInvalid}
                      value={state.backupEmail.value}
                      onChange={this.handleChangeBackupEmail}
                      onKeyDown={this.handleInputKeyDown}
                      maxLength={512}
                    />

                    <div className='forgotpassword__card__body__submsg'>
                      {props.t('We are going to send you an email containing a link to reset your password')}
                    </div>

                    <div className='forgotpassword__card__body__btn'>
                      <Button
                        htmlType='button'
                        bootstrapType=''
                        customClass='outlineTextBtn nohover forgotpassword__card__body__btncancel btn primaryColorFont primaryColorBorder'
                        label={props.t('Cancel')}
                        onClick={this.handleClickCancel}
                      />

                      <Button
                        htmlType='button'
                        bootstrapType=''
                        customClass='btnSubmit forgotpassword__card__body__btnsubmit'
                        label={props.t('Validate')}
                        onClick={this.handleClickSubmit}
                      />
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

const mapStateToProps = () => ({})
export default connect(mapStateToProps)(translate()(ForgotPassword))
