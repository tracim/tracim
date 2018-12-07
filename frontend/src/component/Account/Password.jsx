import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { newFlashMessage } from '../../action-creator.sync.js'

export class Password extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      oldPassword: '',
      newPassword: '',
      newPassword2: '',
      checkAdminPassword: ''
    }
  }

  handleChangeOldPassword = e => {
    const { props } = this
    if (e.target.value.length > 512) {
      props.dispatch(newFlashMessage(props.t('Password cannot exceed 512 characters')))
      return
    }
    this.setState({oldPassword: e.target.value})
  }

  handleChangeNewPassword = e => {
    const { props } = this
    if (e.target.value.length > 512) {
      props.dispatch(newFlashMessage(props.t('Password cannot exceed 512 characters')))
      return
    }
    this.setState({newPassword: e.target.value})
  }

  handleChangeNewPassword2 = e => {
    const { props } = this
    if (e.target.value.length > 512) {
      props.dispatch(newFlashMessage(props.t('Password cannot exceed 512 characters')))
      return
    }
    this.setState({newPassword2: e.target.value})
  }

  handleChangeCheckAdminPassword = e => this.setState({checkAdminPassword: e.target.value})

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

    const validationPassword = props.displayAdminInfo ? state.checkAdminPassword : state.oldPassword

    await props.onClickSubmit(validationPassword, state.newPassword, state.newPassword2) && this.setState({
      oldPassword: '',
      newPassword: '',
      newPassword2: '',
      checkAdminPassword: ''
    })
  }

  isSubmitDisabled = () => {
    const { props, state } = this
    return props.displayAdminInfo
      ? state.newPassword === '' || state.newPassword2 === ''
      : state.oldPassword === '' || state.newPassword === '' || state.newPassword2 === ''
  }

  render () {
    const { props, state } = this

    return (
      <div className='account__userpreference__setting__personaldata'>
        <div className='personaldata__sectiontitle subTitle ml-2 ml-sm-0'>
          {props.displayAdminInfo
            ? props.t('Change the password')
            : props.t('Change my password')
          }
        </div>

        <div className='personaldata__text ml-2 ml-sm-0' />

        <form className='personaldata__form mr-5'>
          {props.displayAdminInfo === false && (
            <div className='d-flex align-items-center flex-wrap mb-4'>
              <input
                className='personaldata__form__txtinput primaryColorBorderLighten form-control'
                type='password'
                placeholder={props.t('Old password')}
                value={state.oldPassword}
                onChange={this.handleChangeOldPassword}
                maxLength={513}
              />
            </div>
          )}

          <div className='d-flex align-items-center flex-wrap mb-4'>
            <input
              className='personaldata__form__txtinput primaryColorBorderLighten form-control'
              type='password'
              placeholder={props.t('New password')}
              value={state.newPassword}
              onChange={this.handleChangeNewPassword}
              maxLength={513}
            />
          </div>

          <div className='d-flex align-items-center flex-wrap mb-4'>
            <input
              className='personaldata__form__txtinput withAdminMsg primaryColorBorderLighten form-control'
              type='password'
              placeholder={props.t('Repeat new password')}
              value={state.newPassword2}
              onChange={this.handleChangeNewPassword2}
              maxLength={513}
            />

            {props.displayAdminInfo && state.newPassword !== '' && (
              <input
                className='personaldata__form__txtinput checkPassword primaryColorBorderLighten form-control mt-3 mt-sm-0'
                type='password'
                placeholder={props.t("Administrator's password")}
                value={state.checkAdminPassword}
                onChange={this.handleChangeCheckAdminPassword}
                disabled={state.newPassword === '' && state.newPassword2 === ''}
              />
            )}
            {props.displayAdminInfo && state.newPassword !== '' && (
              <div className='personaldata__form__txtinput__info'>
                <i className='personaldata__form__txtinput__info__icon fa fa-lightbulb-o' />
                {props.t('This edition requires your administrator password')}
              </div>
            )}
          </div>

          <button
            type='button'
            className='personaldata__form__button btn outlineTextBtn primaryColorBorderLighten primaryColorBgHover primaryColorBorderDarkenHover'
            onClick={this.handleClickSubmit}
            disabled={this.isSubmitDisabled()}
          >
            {props.t('Validate')}
          </button>
        </form>

      </div>
    )
  }
}

const mapStateToProps = () => ({})
export default connect(mapStateToProps)(translate()(Password))

Password.defaultProps = {
  displayAdminInfo: false
}
