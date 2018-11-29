import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { newFlashMessage } from '../../action-creator.sync.js'

require('./PersonalData.styl')

export class PersonalData extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      newName: '',
      newEmail: '',
      checkPassword: ''
    }
  }

  handleChangeName = e => this.setState({newName: e.target.value})

  handleChangeEmail = e => this.setState({newEmail: e.target.value})

  handleChangeCheckPassword = e => this.setState({checkPassword: e.target.value})

  handleClickSubmit = async () => {
    const { props, state } = this

    if (state.newEmail !== '' && state.checkPassword === '') {
      props.dispatch(newFlashMessage(props.t('Please type your password in order to change your email. (For security reasons)'), 'warning'))
      return
    }

    await props.onClickSubmit(state.newName, state.newEmail, state.checkPassword) && this.setState({
      newName: '',
      newEmail: '',
      checkPassword: ''
    })
  }

  render () {
    const { props, state } = this
    return (
      <div className='account__userpreference__setting__personaldata'>
        <div className='personaldata__sectiontitle subTitle ml-2 ml-sm-0'>
          {props.t('Account information')}
        </div>

        <div className='personaldata__text ml-2 ml-sm-0' />

        <form className='personaldata__form'>
          <div className='d-flex align-items-center flex-wrap mb-4'>
            <input
              className='personaldata__form__txtinput primaryColorBorderLighten form-control mt-3 mt-sm-0'
              type='text'
              placeholder={props.t('Change your full name')}
              value={state.newName}
              onChange={this.handleChangeName}
            />
          </div>

          <div className='d-flex align-items-center flex-wrap mb-4'>
            <input
              className='personaldata__form__txtinput withAdminMsg primaryColorBorderLighten form-control mt-3 mt-sm-0'
              type='email'
              placeholder={props.t('Change your email')}
              value={state.newEmail}
              onChange={this.handleChangeEmail}
            />

          </div>
          <div className='d-flex align-items-center flex-wrap mb-4'>
            <input
              className='personaldata__form__txtinput checkPassword primaryColorBorderLighten form-control mt-3 mt-sm-0'
              type='password'
              placeholder={props.displayAdminInfo ? props.t("Administrator's password") : props.t('Type your password')}
              value={state.checkPassword}
              onChange={this.handleChangeCheckPassword}
              disabled={state.newEmail === ''}
            />
            {props.displayAdminInfo &&
              <div className='personaldata__form__txtinput__info'>
                <i className='personaldata__form__txtinput__info__icon fa fa-lightbulb-o' />
                {props.t('This edition requires your administrator password')}
              </div>
            }
          </div>

          <button
            type='button'
            className='personaldata__form__button btn outlineTextBtn primaryColorBorderLighten primaryColorBgHover primaryColorBorderDarkenHover'
            onClick={this.handleClickSubmit}
          >
            {props.t('Validate')}
          </button>
        </form>
      </div>
    )
  }
}

PersonalData.propTypes = {
  onClickSubmit: PropTypes.func
}

const mapStateToProps = () => ({}) // connect for .dispatch()
export default connect(mapStateToProps)(translate()(PersonalData))
