import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import Button from '../component/common/Input/Button.jsx'
import { postResetPassword } from '../action-creator.async.js'
import { newFlashMessage } from '../action-creator.sync.js'

export class ResetPassword extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      newPassword: '',
      newPassword2: ''
    }
  }

  handleInputKeyDown = e => e.key === 'Enter' && this.handleClickSubmit()

  handleChangePassword = e => this.setState({newPassword: e.target.value})

  handleChangePassword2 = e => this.setState({newPassword2: e.target.value})

  handleClickSubmit = async () => {
    const { props, state } = this

    const fetchPostResetPassword = await props.dispatch(postResetPassword(state.backupEmail.value))
    switch (fetchPostResetPassword.status) {
      case 200: props.dispatch(newFlashMessage(props.t('Your password has been changed. You can now login.'), 'info')); break
      default: props.dispatch(newFlashMessage(props.t('An error has happened. Please try again.'), 'warning'))
    }
  }

  render () {
    const { props, state } = this

    return (
      <section className='unLoggedPage resetpassword primaryColorBg'>
        <div className='container-fluid'>
          <div className='row justify-content-center'>
            <div className='col-12 col-sm-11 col-md-8 col-lg-6 col-xl-4'>
              <Card customClass='resetpassword__card'>
                <CardHeader customClass='resetpassword__card__header primaryColorBgLighten text-center'>
                  {props.t('Reset password')}
                </CardHeader>

                <CardBody formClass='resetpassword__card__body'>
                  <div>
                    <InputGroupText
                      parentClassName='resetpassword__card__body__groupemail'
                      customClass=''
                      icon='fa-lock'
                      type='password'
                      placeHolder={props.t('Password')}
                      value={state.newPassword}
                      invalidMsg=''
                      onChange={this.handleChangePassword}
                      onKeyDown={this.handleInputKeyDown}
                      maxLength={512}
                    />

                    <InputGroupText
                      parentClassName='resetpassword__card__body__groupemail'
                      customClass=''
                      icon='fa-lock'
                      type='password'
                      placeHolder={props.t('Confirm password')}
                      value={state.newPassword2}
                      invalidMsg=''
                      onChange={this.handleChangePassword2}
                      onKeyDown={this.handleInputKeyDown}
                      maxLength={512}
                    />

                    <div className='d-flex align-items-end'>
                      <Button
                        htmlType='button'
                        bootstrapType='primary'
                        customClass='btnSubmit resetpassword__card__body__btnsubmit ml-auto'
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
export default connect(mapStateToProps)(translate()(ResetPassword))
