import React from 'react'
import { translate } from 'react-i18next'
import { Popover, PopoverBody } from 'reactstrap'
import {
  CUSTOM_EVENT,
  PROFILE_LIST,
  removeAtInUsername
} from 'tracim_frontend_lib'
import { ALLOWED_CHARACTERS_USERNAME } from '../helper.js'

export class AddUserForm extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      newUserName: '',
      newUserUsername: '',
      newUserEmail: '',
      newUserPassword: '',
      newUserProfile: '',
      popoverEmailInfoOpen: false
    }
  }

  handleTogglePopoverEmailInfo = () => {
    this.setState(prevState => ({
      popoverEmailInfoOpen: !prevState.popoverEmailInfoOpen
    }))
  }

  handleChangeNewUserName = e => this.setState({ newUserName: e.target.value })

  handleChangeNewUserUsername = e => {
    this.setState({ newUserUsername: e.target.value })
    this.props.onChangeUsername(e.target.value)
  }

  handleChangeNewUserEmail = e => this.setState({ newUserEmail: e.target.value })

  handleChangeNewUserPassword = e => this.setState({ newUserPassword: e.target.value })

  handleChangeNewUserProfile = e => this.setState({ newUserProfile: e.currentTarget.value })

  handleClickAddUser = () => {
    const { props, state } = this

    if (state.newUserName === '' || (state.newUserUsername === '' && state.newUserEmail === '') || state.newUserProfile === '') {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: props.t('Please enter a name, an email, a password and select a profile'),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    props.onClickAddUser(
      state.newUserName,
      removeAtInUsername(state.newUserUsername),
      state.newUserEmail,
      state.newUserProfile,
      state.newUserPassword
    )
  }

  isValidateButtonDisabled = () => {
    const { props, state } = this
    if (state.newUserName === '' || state.newUserProfile === '') return true
    if (!props.emailNotifActivated && state.newUserPassword === '') return true
    if (props.isEmailRequired && state.newUserEmail === '') return true
    else return ((state.newUserUsername === '' || !props.isUsernameValid) && state.newUserEmail === '')
  }

  render () {
    const { props, state } = this

    return (
      <form className='adminUser__adduser__form' data-cy='adminUser__adduser__form'>
        <div className='adminUser__adduser__form__userData'>
          <label className='userData__text' htmlFor='adduser_name'>
            {props.t('Full name')}
          </label>

          <input
            type='text'
            className='userData__input form-control'
            id='adduser_name'
            placeholder={props.t('Full name')}
            value={state.newUserName}
            onChange={this.handleChangeNewUserName}
            data-cy='adduser_name'
          />

          <label className='userData__text' htmlFor='adduser_username'>
            {props.t('Username')}
          </label>

          <input
            type='text'
            className='userData__input form-control'
            id='adduser_username'
            placeholder={props.t('@username')}
            value={state.newUserUsername}
            onChange={this.handleChangeNewUserUsername}
            data-cy='adduser_username'
          />

          {!props.isUsernameValid && state.newUserUsername !== '' && (
            <div className='userData__input__username__errorMsg'>
              <i className='userData__input__username__errorIcon fa fa-times' />
              {props.usernameInvalidMsg}
            </div>
          )}
          {props.isUsernameValid && (
            <div className='userData__input__username__errorInfo'>
              {props.t('Allowed characters: {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })}
            </div>
          )}

          <div className='userData__email'>
            <label className='userData__text' htmlFor='adduser_email'>
              {props.t('Email')}
            </label>

            {!props.emailNotifActivated && (
              <>
                <button
                  type='button'
                  className='userData__email__info'
                  id='popoverEmailInfo'
                >
                  <i className='fa fa-fw fa-question-circle' />
                </button>

                <Popover
                  placement='bottom'
                  isOpen={state.popoverEmailInfoOpen}
                  target='popoverEmailInfo'
                  // INFO - GB - 20200507 - ignoring rule react/jsx-handler-names for prop bellow because it comes from external lib
                  toggle={this.handleTogglePopoverEmailInfo} // eslint-disable-line react/jsx-handler-names
                  trigger='hover'
                >
                  <PopoverBody>
                    {props.t('Linking an email address is required for the user to be able to reset the password.')}
                  </PopoverBody>
                </Popover>
              </>
            )}
          </div>

          <input
            type='text'
            className='userData__input form-control'
            id='adduser_email'
            placeholder={props.t('Email')}
            value={state.newUserEmail}
            onChange={this.handleChangeNewUserEmail}
            data-cy='adduser_email'
          />

          {(!props.emailNotifActivated || state.newUserEmail === '') && (
            <div>
              <label className='userData__text' htmlFor='adduser_password'>
                {props.t('Password')}
              </label>

              <input
                type='text'
                className='userData__input form-control'
                id='adduser_password'
                placeholder={props.t('Password')}
                value={state.newUserPassword}
                onChange={this.handleChangeNewUserPassword}
                data-cy='adduser_password'
              />
            </div>
          )}
          {(props.emailNotifActivated && state.newUserEmail === '') && (
            <div className='userData__info'>
              <i className='fa fa-exclamation-triangle userData__info__icon' />
              {props.t('If you do not link an email to this new user, please notify manually the username and password.')}
            </div>
          )}
        </div>

        <div className='adminUser__adduser__form__profile'>
          <div className='profile__text'>
            {props.t('Choose the profile')}
          </div>

          <div className='profile__list'>
            {PROFILE_LIST.map(p =>
              <label
                className='profile__list__item'
                htmlFor={p.slug}
                key={p.id}
                data-cy={`profile__list__item__${p.slug}`}
              >
                <div className='d-flex align-items'>
                  <div className='userrole__role__input'>
                    <input
                      type='radio'
                      name='newUserProfile'
                      id={p.slug}
                      value={p.slug}
                      checked={state.newUserProfile === p.slug}
                      onChange={this.handleChangeNewUserProfile}
                    />
                  </div>

                  <div className='userrole__role__icon mx-2' style={{ color: p.hexcolor }}>
                    <i className={`fa fa-fw fa-${p.faIcon}`} />
                  </div>

                  <div className='profile__list__item__content'>
                    <div className='profile__list__item__content__label'>
                      {props.t(p.label) /* this trad key is declared in frontend/helper.js, object PROFILE */}
                    </div>
                    <div className='profile__list__item__content__description'>
                      {props.t(p.description) /* this trad key is declared in frontend/helper.js, object PROFILE */}
                    </div>
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>
        <div className='adminUser__adduser__form__submit'>
          <button
            type='button'
            className='btn highlightBtn primaryColorBg primaryColorBorderDarkenHover primaryColorBgDarkenHover'
            onClick={this.handleClickAddUser}
            data-cy='adminUser__adduser__form__submit'
            disabled={this.isValidateButtonDisabled()}
          >
            {props.t('Create the user')}
            <i className='fa fa-fw fa-check' />
          </button>
        </div>
      </form>
    )
  }
}

export default translate()(AddUserForm)
