import React from 'react'
import { translate } from 'react-i18next'
import {
  CUSTOM_EVENT,
  PROFILE_LIST
} from 'tracim_frontend_lib'

export class AddUserForm extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      newUserName: '',
      newUserEmail: '',
      newUserPassword: '',
      newUserProfile: ''
    }
  }

  handleChangeNewUserName = e => this.setState({ newUserName: e.target.value })

  handleChangeNewUserEmail = e => this.setState({ newUserEmail: e.target.value })

  handleChangeNewUserPassword = e => this.setState({ newUserPassword: e.target.value })

  handleChangeNewUserProfile = e => this.setState({ newUserProfile: e.currentTarget.value })

  handleClickAddUser = () => {
    const { props, state } = this

    if (state.newUserName === '' || state.newUserEmail === '' || state.newUserProfile === '') {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: props.t('Please type a name, an email, a password and select a profile'),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    props.onClickAddUser(state.newUserName, state.newUserEmail, state.newUserProfile, state.newUserPassword)
  }

  isValidateButtonDisabled = () => {
    const { props, state } = this
    return props.emailNotifActivated
      ? [state.newUserName, state.newUserEmail, state.newUserProfile].some(i => i === '')
      : [state.newUserName, state.newUserEmail, state.newUserPassword, state.newUserProfile].some(i => i === '')
  }

  render () {
    const { props, state } = this

    return (
      <form className='adminUser__adduser__form' data-cy='adminUser__adduser__form'>
        <div className='adminUser__adduser__form__username'>
          <label className='username__text' htmlFor='adduser_name'>
            {props.t('Full name')}
          </label>

          <input
            type='text'
            className='username__input form-control'
            id='adduser_name'
            placeholder={props.t('Full name')}
            value={state.newUserName}
            onChange={this.handleChangeNewUserName}
            data-cy='adduser_name'
          />

          <label className='username__text' htmlFor='adduser_email'>
            {props.t('Email')}
          </label>

          <input
            type='text'
            className='username__input form-control'
            id='adduser_email'
            placeholder={props.t('Email')}
            value={state.newUserEmail}
            onChange={this.handleChangeNewUserEmail}
            data-cy='adduser_email'
          />

          {!props.emailNotifActivated && (
            <div>
              <label className='username__text' htmlFor='adduser_password'>
                {props.t('Password')}
              </label>

              <input
                type='text'
                className='username__input form-control'
                id='adduser_password'
                placeholder={props.t('Password')}
                value={state.newUserPassword}
                onChange={this.handleChangeNewUserPassword}
                data-cy='adduser_password'
              />
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
                    <div className='profile__list__item__content__description' >
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
