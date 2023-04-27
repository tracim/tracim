import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import { postForgotPassword, getConfig } from '../action-creator.async.js'
import {
  newFlashMessage,
  resetBreadcrumbs,
  setConfig,
  setHeadTitle
} from '../action-creator.sync.js'
import {
  CUSTOM_EVENT,
  checkEmailValidity,
  IconButton,
  PAGE
} from 'tracim_frontend_lib'

export class ForgotPassword extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      backupLogin: {
        value: '',
        isInvalid: false
      }
    }

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
    const { props } = this

    this.setHeadTitle()
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

  handleInputKeyDown = e => e.key === 'Enter' && this.handleClickSubmit()

  handleChangeBackupLogin = e => this.setState({ backupLogin: { value: e.target.value, isInvalid: false } })

  handleClickCancel = () => this.props.history.push(PAGE.LOGIN)

  handleClickSubmit = async () => {
    const { props, state } = this
    const backupLogin = state.backupLogin.value.trim()

    const fetchPostResetPassword = await props.dispatch(
      postForgotPassword(
        checkEmailValidity(backupLogin) ? { email: backupLogin } : { username: backupLogin }
      )
    )

    props.history.push(PAGE.LOGIN)

    switch (fetchPostResetPassword.status) {
      case 204:
        props.dispatch(
          newFlashMessage(
            props.t('If your email address exists in our database, you will receive there a password recovery link shortly. If it doesn’t appear check your spam folder.'),
            'info',
            10000
          )
        )
        break
      default:
        props.dispatch(
          newFlashMessage(props.t('An error has happened, please try again'), 'warning')
        )
    }
  }

  render () {
    const { props, state } = this

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

              <InputGroupText
                parentClassName='forgotpassword__card__body__grouplogin'
                customClass=''
                icon='fa-at'
                type='text'
                placeHolder={props.t('Email address or username')}
                value={state.backupLogin.value}
                onChange={this.handleChangeBackupLogin}
                onKeyDown={this.handleInputKeyDown}
                maxLength={512}
              />

              <div className='forgotpassword__card__body__submsg'>
                {props.t('We are going to send you an email containing a link to reset your password')}
              </div>

              <div className='forgotpassword__card__body__btn'>
                <IconButton
                  customClass='forgotpassword__card__body__btncancel'
                  intent='secondary'
                  onClick={this.handleClickCancel}
                  icon='fas fa-arrow-left'
                  text={props.t('Cancel')}
                />

                <IconButton
                  customClass='forgotpassword__card__body__btnsubmit'
                  intent='primary'
                  mode='light'
                  onClick={this.handleClickSubmit}
                  icon='fas fa-check'
                  text={props.t('Validate')}
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

export default connect(mapStateToProps)(translate()(ForgotPassword))
