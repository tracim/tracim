import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import Button from '../component/common/Input/Button.jsx'
import { resetBreadcrumbs, setConfig, setHeadTitle } from '../action-creator.sync.js'
import { CUSTOM_EVENT, PAGE } from 'tracim_frontend_lib'
import { getConfig } from '../action-creator.async'

export class ForgotPasswordNoEmailNotif extends React.Component {
  constructor (props) {
    super(props)

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

  componentDidMount () {
    this.setHeadTitle()
    const { props } = this

    props.dispatch(resetBreadcrumbs())
    if (!props.system.config.instance_name) this.loadConfig()
  }

  loadConfig = async () => {
    const { props } = this

    const fetchGetConfig = await props.dispatch(getConfig())
    if (fetchGetConfig.status === 200) {
      props.dispatch(setConfig(fetchGetConfig.json))
    }
  }

  setHeadTitle = () => {
    const { props } = this

    props.dispatch(setHeadTitle(props.t('Forgotten password')))
  }

  handleClickBack = () => this.props.history.push(PAGE.LOGIN)

  render () {
    const { props } = this

    return (
      <section className='forgotpassword'>
        <Card customClass='forgotpassword__card'>
          <CardHeader customClass='forgotpassword__card__header primaryColorBgLighten text-center'>
            {props.t('Forgot password')}
          </CardHeader>

          <CardBody formClass='forgotpassword__card__body'>
            <div>
              <div className='forgotpassword__card__body__title'>
                {props.t('Did you forget your password?')}
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
                  customClass='highlightBtn primaryColorBg primaryColorBgDarkenHover forgotpassword__card__body__btnsubmit'
                  label={props.t('Go back to previous page')}
                  onClick={this.handleClickBack}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <FooterLogin />
      </section>
    )
  }
}

const mapStateToProps = ({ system }) => ({ system })

export default connect(mapStateToProps)(translate()(ForgotPasswordNoEmailNotif))
