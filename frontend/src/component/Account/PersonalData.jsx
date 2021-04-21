import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { newFlashMessage } from '../../action-creator.sync.js'
import { ALLOWED_CHARACTERS_USERNAME } from 'tracim_frontend_lib'

import {
  editableUserAuthTypeList
} from '../../util/helper.js'

require('./PersonalData.styl')

export class PersonalData extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      newPublicName: '',
      newUsername: '',
      newEmail: '',
      checkPassword: ''
    }
  }

  handleChangePublicName = e => this.setState({ newPublicName: e.target.value })

  handleChangeUserName = e => {
    this.setState({ newUsername: e.target.value })
    this.props.onChangeUsername(e.target.value)
  }

  handleChangeEmail = e => this.setState({ newEmail: e.target.value })

  handleChangeCheckPassword = e => this.setState({ checkPassword: e.target.value })

  handleClickSubmit = async () => {
    const { props, state } = this

    if ((state.newEmail !== '' || state.newUsername !== '') && state.checkPassword === '') {
      props.dispatch(newFlashMessage(props.t('Please type your password in order to change your email and/or username. (For security reasons)'), 'warning'))
      return
    }

    await props.onClickSubmit(state.newPublicName, state.newUsername, state.newEmail, state.checkPassword) && this.setState({
      newPublicName: '',
      newUsername: '',
      newEmail: '',
      checkPassword: ''
    })
  }

  render () {
    const { props, state } = this
    return (
      <div className='account__userpreference__setting__personaldata'>
        <div className='personaldata__sectiontitle subTitle ml-2 ml-sm-0'>
          {(props.displayAdminInfo
            ? props.t('Change the account settings')
            : props.t('Change my account settings')
          )}
        </div>

        <div className='personaldata__text ml-2 ml-sm-0' />

        <form className='personaldata__form'>
          <div className='d-flex align-items-center flex-wrap mb-4'>
            <label>
              {props.t('New full name')}
              <input
                className='personaldata__form__txtinput primaryColorBorderLighten form-control'
                type='text'
                data-cy='personaldata__form__txtinput__fullname'
                placeholder={props.userPublicName}
                value={state.newPublicName}
                onChange={this.handleChangePublicName}
              />
            </label>
          </div>

          <div>
            <label>
              {props.t('New username')}
              <input
                className='personaldata__form__txtinput primaryColorBorderLighten form-control'
                type='text'
                data-cy='personaldata__form__txtinput__username'
                placeholder={props.userUsername}
                value={state.newUsername}
                onChange={this.handleChangeUserName}
              />
            </label>
            {!props.isUsernameValid && (
              <div className='personaldata__form__txtinput__msgerror'>
                <i className='personaldata__form__txtinput__msgerror__icon fas fa-times' />
                {props.usernameInvalidMsg}
              </div>
            )}
            {props.isUsernameValid && (
              <div className='personaldata__form__txtinput__msginfo'>
                {props.t('Allowed characters: {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })}
              </div>
            )}
          </div>

          {editableUserAuthTypeList.includes(props.userAuthType) && (
            <div className='d-flex align-items-center flex-wrap mb-4 mt-4'>
              <label>
                {props.t('New email')}
                <input
                  className='personaldata__form__txtinput withAdminMsg primaryColorBorderLighten form-control'
                  type='email'
                  data-cy='personaldata__form__txtinput__email'
                  placeholder={props.userEmail}
                  value={state.newEmail}
                  onChange={this.handleChangeEmail}
                />
              </label>
            </div>
          )}

          {(state.newEmail !== '' || state.newUsername !== '') && (
            <div className='align-items-center flex-wrap mb-4'>
              <input
                className='personaldata__form__txtinput checkPassword primaryColorBorderLighten form-control mt-3 mt-sm-0'
                type='password'
                placeholder={props.displayAdminInfo ? props.t("Administrator's password") : props.t('Type your password')}
                value={state.checkPassword}
                onChange={this.handleChangeCheckPassword}
                disabled={state.newEmail === '' && state.newUsername === ''}
              />
            </div>
          )}

          <button
            type='button'
            className='personaldata__form__button btn outlineTextBtn primaryColorBorderLighten primaryColorBgHover primaryColorBorderDarkenHover'
            onClick={this.handleClickSubmit}
            disabled={!props.isUsernameValid}
          >
            {props.t('Validate')}
          </button>
        </form>
      </div>
    )
  }
}

PersonalData.propTypes = {
  userEmail: PropTypes.string,
  userUsername: PropTypes.string,
  userAuthType: PropTypes.string,
  onClickSubmit: PropTypes.func,
  onChangeUsername: PropTypes.func,
  isUsernameValid: PropTypes.bool,
  displayAdminInfo: PropTypes.bool
}

PersonalData.defaultProps = {
  userEmail: '',
  userUsername: '',
  userPublicName: '',
  isUsernameValid: true,
  userAuthType: '',
  onClickSubmit: () => {},
  onChangeUsername: () => {},
  displayAdminInfo: false
}

const mapStateToProps = () => ({}) // connect for .dispatch()
export default connect(mapStateToProps)(translate()(PersonalData))
