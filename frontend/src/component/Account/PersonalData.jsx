import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { newFlashMessage } from '../../action-creator.sync.js'
import {
  ALLOWED_CHARACTERS_USERNAME,
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
            ? props.t('Change the profile')
            : props.t('Change my profile')
          )}
        </div>

        <div className='personaldata__text ml-2 ml-sm-0' />

        <form className='personaldata__form'>
          <div className='d-flex align-items-center flex-wrap mb-4'>
            <input
              className='personaldata__form__txtinput primaryColorBorderLighten form-control mt-3 mt-sm-0'
              type='text'
              data-cy='personaldata__form__txtinput__fullname'
              placeholder={props.t('New full name')}
              value={state.newPublicName}
              onChange={this.handleChangePublicName}
            />
          </div>

          <div className='d-flex align-items-center flex-wrap'>
            <input
              className='personaldata__form__txtinput primaryColorBorderLighten form-control mt-3 mt-sm-0'
              type='text'
              data-cy='personaldata__form__txtinput__username'
              placeholder={props.t('New @username')}
              value={state.newUsername}
              onChange={this.handleChangeUserName}
            />
            {!props.newUsernameAvailability && (
              <div className='personaldata__form__txtinput__msgerror'>
                <i className='personaldata__form__txtinput__msgerror__icon fa fa-times' />
                {props.t('This username is not available')}
              </div>
            )}
            {state.newUsername !== '' && props.newUsernameAvailability && (
              <div className='personaldata__form__txtinput__msginfo'>
                {props.t('Allowed characters: {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })}
              </div>
            )}
          </div>

          {state.newUsername !== '' && (
            <div className='personaldata__form__txtinput__info'>
              <i className='fa fa-exclamation-triangle personaldata__form__txtinput__info__icon' />
              {props.t('Changing your username will not update the mentions using your current username.')}
            </div>
          )}

          {editableUserAuthTypeList.includes(props.userAuthType) && (
            <div className='d-flex align-items-center flex-wrap mb-4 mt-4'>
              <input
                className='personaldata__form__txtinput withAdminMsg primaryColorBorderLighten form-control mt-3 mt-sm-0'
                type='email'
                data-cy='personaldata__form__txtinput__email'
                placeholder={props.t('New email')}
                value={state.newEmail}
                onChange={this.handleChangeEmail}
              />
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
              {props.displayAdminInfo && (
                <div className='personaldata__form__txtinput__info'>
                  <i className='personaldata__form__txtinput__info__icon fa fa-lightbulb-o' />
                  {props.t('This edition requires your administrator password')}
                </div>
              )}
            </div>
          )}

          <button
            type='button'
            className='personaldata__form__button btn outlineTextBtn primaryColorBorderLighten primaryColorBgHover primaryColorBorderDarkenHover'
            onClick={this.handleClickSubmit}
            disabled={!props.newUsernameAvailability}
          >
            {props.t('Validate')}
          </button>
        </form>
      </div>
    )
  }
}

PersonalData.propTypes = {
  userAuthType: PropTypes.string,
  onClickSubmit: PropTypes.func,
  onChangeUsername: PropTypes.func,
  newUsernameAvailability: PropTypes.bool,
  displayAdminInfo: PropTypes.bool
}

PersonalData.defaultProps = {
  newUsernameAvailability: true,
  userAuthType: '',
  onClickSubmit: () => {},
  onChangeUsername: () => {},
  displayAdminInfo: false
}

const mapStateToProps = () => ({}) // connect for .dispatch()
export default connect(mapStateToProps)(translate()(PersonalData))
