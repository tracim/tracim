import React from 'react'
import { translate } from 'react-i18next'
import { newFlashMessage } from '../../action-creator.sync.js'

export class Password extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      oldPassword: '',
      newPassword: '',
      newPassword2: ''
    }
  }

  handleChangeOldPassword = e => this.setState({oldPassword: e.target.value})

  handleChangeNewPassword = e => this.setState({newPassword: e.target.value})

  handleChangeNewPassword2 = e => this.setState({newPassword2: e.target.value})

  handleClickSubmit = () => {
    const { props, state } = this

    if (state.newPassword !== state.newPassword2) {
      props.dispatch(newFlashMessage('New passwords are differents'))
      return
    }

    props.onClickSubmit(state.oldPassword, state.newPassword, state.newPassword2)
  }

  render () {
    const { props } = this

    return (
      <div className='account__userpreference__setting__personaldata'>
        <div className='personaldata__sectiontitle subTitle ml-2 ml-sm-0'>
          {props.t('Change your password')}
        </div>

        <div className='personaldata__text ml-2 ml-sm-0' />

        <form className='personaldata__form mr-5'>
          <div className='personaldata__form__title'>
            {props.t('Password')}
          </div>

          <input
            className='personaldata__form__txtinput primaryColorBorderLighten form-control'
            type='password'
            placeholder={props.t('Old password')}
            onChange={this.handleChangeOldPassword}
          />

          <input
            className='personaldata__form__txtinput primaryColorBorderLighten form-control mt-4'
            type='password'
            placeholder={props.t('New password')}
            onChange={this.handleChangeNewPassword}
          />

          <input
            className='personaldata__form__txtinput primaryColorBorderLighten form-control mt-4'
            type='password'
            placeholder={props.t('Repeat new password')}
            onChange={this.handleChangeNewPassword2}
          />

          <button
            type='button'
            className='personaldata__form__button btn outlineTextBtn primaryColorBorderLighten primaryColorBgHover primaryColorBorderDarkenHover mt-4'
            onClick={this.handleClickSubmit}
          >
            {props.t('Send')}
          </button>
        </form>

      </div>
    )
  }
}

export default translate()(Password)
