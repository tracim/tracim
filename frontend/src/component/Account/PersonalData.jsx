import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { newFlashMessage } from '../../action-creator.sync.js'
import {
  ALLOWED_CHARACTERS_USERNAME,
  IconButton
} from 'tracim_frontend_lib'
import DropdownLang from '../DropdownLang.jsx'
import { UserReadOnlyFields } from '../../util/helper'

require('./PersonalData.styl')

export class PersonalData extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      newPublicName: '',
      newUsername: '',
      newEmail: '',
      newLang: props.user ? props.user.lang : '',
      checkPassword: ''
    }
  }

  isDisabled = field => {
    if (!this.props.system || !this.props.system.config) return false
    if (!this.props.system.config.user__read_only_fields[this.props.userAuthType]) return false

    return (
      !this.props.isAdmin &&
      this.props.system.config.user__read_only_fields[this.props.userAuthType].includes(field)
    )
  }

  handleChangePublicName = e => this.setState({ newPublicName: e.target.value })

  handleChangeUserName = e => {
    this.setState({ newUsername: e.target.value })
    this.props.onChangeUsername(e.target.value)
  }

  handleChangeLang = newLang => this.setState({ newLang })

  handleChangeEmail = e => {
    const email = e.target.value.trim()
    this.setState({ newEmail: email })
  }

  handleChangeCheckPassword = e => this.setState({ checkPassword: e.target.value })

  handleClickSubmit = async () => {
    const { props, state } = this

    if ((state.newEmail !== '' || state.newUsername !== '') && state.checkPassword === '') {
      props.dispatch(newFlashMessage(props.t('Please type your password in order to change your email and/or username. (For security reasons)'), 'warning'))
      return
    }

    await props.onClickSubmit(state.newPublicName, state.newUsername, state.newEmail, state.checkPassword, state.newLang) && this.setState({
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
        <div className='personaldata__sectiontitle subTitle'>
          {(props.isAdmin
            ? props.t('Change the account settings')
            : props.t('Change my account settings')
          )}
        </div>

        <form className='personaldata__form'>
          <label>
            {props.t('New full name:')}
            <input
              className='personaldata__form__txtinput form-control'
              type='text'
              data-cy='personaldata__form__txtinput__fullname'
              placeholder={props.userPublicName}
              value={state.newPublicName}
              onChange={this.handleChangePublicName}
              disabled={this.isDisabled(UserReadOnlyFields.PUBLIC_NAME)}
            />
          </label>

          <div>
            <label>
              {props.t('New username:')}
              <input
                className='personaldata__form__txtinput form-control'
                type='text'
                data-cy='personaldata__form__txtinput__username'
                placeholder={props.userUsername}
                value={state.newUsername}
                onChange={this.handleChangeUserName}
                disabled={this.isDisabled(UserReadOnlyFields.USERNAME)}
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

          <div>
            <label>
              {props.t('New email:')}
              <input
                className='personaldata__form__txtinput withAdminMsg form-control'
                type='email'
                data-cy='personaldata__form__txtinput__email'
                placeholder={props.userEmail}
                value={state.newEmail}
                onChange={this.handleChangeEmail}
                disabled={this.isDisabled(UserReadOnlyFields.EMAIL)}
              />
            </label>
          </div>

          {!props.isAdmin && (
            <div>
              {props.t('New language:')}
              <DropdownLang
                langList={props.langList}
                langActiveId={state.newLang}
                onChangeLang={this.handleChangeLang}
              />
            </div>
          )}

          {(state.newEmail !== '' || state.newUsername !== '') && (
            <div>
              <label>
                {props.isAdmin ? props.t("Administrator's password:") : props.t('Type your password:')}
                <input
                  className='personaldata__form__txtinput checkPassword form-control'
                  type='password'
                  value={state.checkPassword}
                  onChange={this.handleChangeCheckPassword}
                  disabled={
                    (this.isDisabled(UserReadOnlyFields.EMAIL) && this.isDisabled(UserReadOnlyFields.USERNAME)) ||
                    (state.newEmail === '' && state.newUsername === '')
                  }
                />
              </label>
            </div>
          )}

          <IconButton
            customClass='personaldata__form__button'
            intent='secondary'
            disabled={!props.isUsernameValid}
            onClick={this.handleClickSubmit}
            icon='fas fa-check'
            text={props.t('Validate')}
            dataCy='IconButton_PersonalData'
          />
        </form>
      </div>
    )
  }
}

PersonalData.propTypes = {
  userEmail: PropTypes.string,
  userUsername: PropTypes.string,
  userPublicName: PropTypes.string,
  userAuthType: PropTypes.string,
  onClickSubmit: PropTypes.func,
  onChangeUsername: PropTypes.func,
  isUsernameValid: PropTypes.bool,
  isAdmin: PropTypes.bool,
  langList: PropTypes.array
}

PersonalData.defaultProps = {
  userEmail: '',
  userUsername: '',
  userPublicName: '',
  isUsernameValid: true,
  userAuthType: '',
  onClickSubmit: () => { },
  onChangeUsername: () => { },
  isAdmin: false,
  langList: [{ id: '', label: '' }]
}

const mapStateToProps = ({ user, system }) => ({ user, system })
export default connect(mapStateToProps)(translate()(PersonalData))
