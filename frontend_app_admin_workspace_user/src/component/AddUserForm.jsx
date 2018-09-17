import React from 'react'
import { translate } from 'react-i18next'

export class AddUserForm extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      newUserEmail: '',
      newUserProfile: ''
    }
  }

  handleChangeNewUserEmail = e => this.setState({newUserEmail: e.target.value})

  handleChangeNewUserProfile = e => this.setState({newUserProfile: e.currentTarget.value})

  handleClickAddUser = () => {
    const { props, state } = this

    if (state.newUserEmail === '' || state.newUserProfile === '') {
      GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t('Please type a name and select a profile'),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    props.onClickAddUser(state.newUserEmail, state.newUserProfile)
  }

  render () {
    const { props, state } = this

    return (
      <form className='adminUser__adduser__form'>
        <div className='adminUser__adduser__form__username'>
          <label className='username__text' htmlFor='adduser'>
            {props.t('Type the email')}
          </label>

          <input
            type='text'
            className='username__input form-control'
            id='adduser'
            placeholder={props.t('Email')}
            value={state.newUserEmail}
            onChange={this.handleChangeNewUserEmail}
          />

          {/*
          <div className='username__createaccount'>
            <input type='radio' id='createuseraccount' />
            <label className='ml-2' htmlFor='createuseraccount'>Create an account for this user</label>
          </div>
          */}
        </div>

        <div className='adminUser__adduser__form__profile'>
          <div className='profile__text'>
            {props.t('Choose the profile')}
          </div>

          <div className='profile__list'>
            {Object.keys(props.profile).map(p => props.profile[p]).map(p =>
              <label
                className='profile__list__item'
                htmlFor={p.slug}
                key={p.id}
              >
                <input
                  type='radio'
                  name='newUserProfile'
                  id={p.slug}
                  value={p.slug}
                  checked={state.newUserProfile === p.slug}
                  onChange={this.handleChangeNewUserProfile}
                />

                <div className='d-flex align-items-center'>
                  <div className='userrole__role__icon mx-2' style={{color: p.hexcolor}}>
                    <i className={`fa fa-fw fa-${p.faIcon}`} />
                  </div>
                  {props.t(p.label) /* this trad key is declared in frontend/helper.js, object PROFILE */}
                </div>
              </label>
            )}
          </div>
        </div>
        <div className='adminUser__adduser__form__submit'>
          <button
            type='button'
            className='btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
            onClick={this.handleClickAddUser}
          >
            {props.t('Add the user')}
          </button>
        </div>
      </form>
    )
  }
}

export default translate()(AddUserForm)
