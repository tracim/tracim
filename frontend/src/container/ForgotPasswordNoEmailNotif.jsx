import React from 'react'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import Button from '../component/common/Input/Button.jsx'
import { PAGE } from '../helper.js'

export class ForgotPasswordNoEmailNotif extends React.Component {
  handleClickBack = () => this.props.history.push(PAGE.LOGIN)

  render () {
    const { props } = this

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

                    <div className='forgotpassword__card__body__submsg'>
                      {props.t("Unfortunately, email notifications aren't activated, we can't send you a reset password email")}.
                    </div>

                    <div className='forgotpassword__card__body__submsg'>
                      {props.t('To change your password, please refer to an administrator')}.
                    </div>

                    <div className='forgotpassword__card__body__btn-no-email'>
                      <Button
                        htmlType='button'
                        bootstrapType=''
                        customClass='btnSubmit forgotpassword__card__body__btnsubmit'
                        label={props.t('Go back to previous page')}
                        onClick={this.handleClickBack}
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

export default translate()(ForgotPasswordNoEmailNotif)
