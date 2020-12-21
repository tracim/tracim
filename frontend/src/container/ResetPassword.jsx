import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { withRouter } from 'react-router-dom'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import Button from '../component/common/Input/Button.jsx'
import {
  postResetPassword,
  getConfig
} from '../action-creator.async.js'
import {
  newFlashMessage,
  resetBreadcrumbs,
  setConfig,
  setHeadTitle
} from '../action-creator.sync.js'
import { CUSTOM_EVENT, PAGE } from 'tracim_frontend_lib'

const qs = require('query-string')

export class ResetPassword extends React.Component {
  constructor (props) {
    super(props)
    const query = qs.parse(props.location.search)
    this.state = {
      newPassword: '',
      newPassword2: '',
      userEmail: query.email || '',
      userToken: query.token || ''
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

  async componentDidMount () {
    const { props } = this
    props.dispatch(resetBreadcrumbs())
    await this.loadConfig()
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
    props.dispatch(setHeadTitle(props.t('Password reset')))
  }

  handleInputKeyDown = e => e.key === 'Enter' && this.handleClickSubmit()

  handleChangePassword = e => this.setState({ newPassword: e.target.value })

  handleChangePassword2 = e => this.setState({ newPassword2: e.target.value })

  handleClickSubmit = async () => {
    const { props, state } = this

    if (state.newPassword.length < 6) {
      props.dispatch(newFlashMessage(props.t('New password is too short (minimum 6 characters)'), 'warning'))
      return
    }

    if (state.newPassword.length > 512) {
      props.dispatch(newFlashMessage(props.t('New password is too long (maximum 512 characters)'), 'warning'))
      return
    }

    if (state.newPassword !== state.newPassword2) {
      props.dispatch(newFlashMessage(props.t('New passwords are different'), 'warning'))
      return
    }

    if (state.userEmail === '' || state.userToken === '') {
      props.dispatch(newFlashMessage(props.t('Information are missing, please use the link in the email your should have received to reset your password'), 'warning'))
      return
    }

    const fetchPostResetPassword = await props.dispatch(postResetPassword(state.newPassword, state.newPassword2, state.userEmail, state.userToken))
    switch (fetchPostResetPassword.status) {
      case 204:
        props.history.push(PAGE.LOGIN)
        props.dispatch(newFlashMessage(props.t('Your password has been changed, you can now login'), 'info'))
        break
      default: props.dispatch(newFlashMessage(props.t('An error has happened, please try again'), 'warning'))
    }
  }

  render () {
    const { props, state } = this

    return (
      <section className='resetpassword'>
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
                  bootstrapType=''
                  customClass='highlightBtn primaryColorBg primaryColorBgDarkenHover resetpassword__card__body__btnsubmit ml-auto'
                  label={props.t('Validate')}
                  onClick={this.handleClickSubmit}
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

export default connect(mapStateToProps)(withRouter(translate()(ResetPassword)))
