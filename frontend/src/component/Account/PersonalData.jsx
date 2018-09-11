import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {newFlashMessage} from '../../action-creator.sync.js'

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

  handleClickSubmit = () => {
    const { props, state } = this

    if (state.newEmail !== '' && state.checkPassword === '') {
      props.dispatch(newFlashMessage(props.t('Please type your password in order to change your email. (For security reasons)'), 'info'))
      return
    }

    props.onClickSubmit(state.newName, state.newEmail, state.checkPassword)
  }

  render () {
    const { props } = this
    return (
      <div className='account__userpreference__setting__personaldata'>
        <div className='personaldata__sectiontitle subTitle ml-2 ml-sm-0'>
          {props.t('Account information')}
        </div>

        <div className='personaldata__text ml-2 ml-sm-0' />

        <form className='personaldata__form'>
          <div className='personaldata__form__title'>
            {props.t('Name')}
          </div>

          <div className='d-flex align-items-center flex-wrap mb-4'>
            <input
              className='personaldata__form__txtinput primaryColorBorderLighten form-control mt-3 mt-sm-0'
              type='text'
              placeholder={props.t('Change your name')}
              onChange={this.handleChangeName}
            />
          </div>

          <div className='personaldata__form__title'>
            {props.t('Email Address:')}
          </div>

          <div className='d-flex align-items-center flex-wrap mb-4'>
            <input
              className='personaldata__form__txtinput primaryColorBorderLighten form-control mt-3 mt-sm-0'
              type='email'
              placeholder={props.t('Change your email')}
              onChange={this.handleChangeEmail}
            />

          </div>

          <div className='d-flex align-items-center flex-wrap mb-4'>
            <input
              className='personaldata__form__txtinput checkPassword primaryColorBorderLighten form-control mt-3 mt-sm-0'
              type='password'
              placeholder={props.t('Check your password')}
              onChange={this.handleChangeCheckPassword}
            />
          </div>

          <button
            type='button'
            className='personaldata__form__button btn outlineTextBtn primaryColorBorderLighten primaryColorBgHover primaryColorBorderDarkenHover'
            onClick={this.handleClickSubmit}
          >
            {props.t('Send')}
          </button>
        </form>
      </div>
    )
  }
}

PersonalData.propTypes = {
  onClickSubmit: PropTypes.func
}

const mapStateToProps = () => ({})
export default connect(mapStateToProps)(translate()(PersonalData))
