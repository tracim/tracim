import React from 'react'
import { connect } from 'react-redux'
import * as Cookies from 'js-cookie'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../util/appFactory.js'

import { COOKIE_FRONTEND } from '../util/helper.js'
import {
  CardPopup,
  IconButton,
  TracimComponent,
  ALLOWED_CHARACTERS_USERNAME,
  MAXIMUM_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME
} from 'tracim_frontend_lib'
import { putUserUsername } from '../action-creator.async.js'
import { newFlashMessage, setUsernamePopup } from '../action-creator.sync.js'


export class CardPopupUsername extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      hidePopupCheckbox: false,
      newUsername: '',
      isUsernameValid: true,
      password: '',
      //usernamePopup: false,
      usernameInvalidMsg: ''
    }
  }

  handleClickCloseUsernamePopup = () => {
    const { props } = this
    props.dispatch(setUsernamePopup(false))
    //this.setState(prevState => ({ usernamePopup: !prevState.usernamePopup }))
  }

  handleClickConfirmUsernamePopup = async () => {
    const { props, state } = this

    if (state.newUsername === '') {
      Cookies.set(COOKIE_FRONTEND.HIDE_USERNAME_POPUP, this.state.hidePopupCheckbox, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
    } else {
      const fetchPutUsername = await props.dispatch(putUserUsername(props.user, state.newUsername, state.password))
      switch (fetchPutUsername.status) {
        case 200:
          props.dispatch(newFlashMessage(props.t('Your username has been set'), 'info'))
          break
        case 400:
          switch (fetchPutUsername.json.code) {
            case 2001:
              props.dispatch(newFlashMessage(
                props.t('Username must be between {{minimumCharactersUsername}} and {{maximumCharactersUsername}} characters long',
                  { minimumCharactersUsername: MINIMUM_CHARACTERS_USERNAME, maximumCharactersUsername: MAXIMUM_CHARACTERS_USERNAME }
                ), 'warning'
              ))
              return false
            case 2062:
              props.dispatch(
                newFlashMessage(props.t('Your username is incorrect, the allowed characters are {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME }), 'warning')
              )
              return false
            default:
              props.dispatch(newFlashMessage(props.t('An error has happened, please try again'), 'warning'))
              return false
          }
        case 403:
          props.dispatch(newFlashMessage(props.t('Invalid password'), 'warning'))
          return false
        default:
          props.dispatch(newFlashMessage(props.t('Error while changing username'), 'warning'))
          return false
      }

      Cookies.set(COOKIE_FRONTEND.HIDE_USERNAME_POPUP, true, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
    }
    this.handleClickCloseUsernamePopup()
  }

  handleChangeNewUsername = async e => {
    const username = e.target.value
    this.setState({ newUsername: username })
    this.debouncedCheckUsername()
  }

  handleChangePassword = e => this.setState({ password: e.target.value })

  handleClickCheckbox = () => {
    this.setState(prevState => ({ hidePopupCheckbox: !prevState.hidePopupCheckbox }))
  }

  disableConfirmButton = () => {
    const { state } = this

    return (
      (state.newUsername === '' && !state.hidePopupCheckbox) ||
      !state.isUsernameValid ||
      (state.newUsername !== '' && state.password === '')
    )
  }

  render () {
    const { props } = this
    return (
      <CardPopup
        customClass='homepage__usernamePopup'
        customHeaderClass='primaryColorBg'
        onClose={this.handleClickCloseUsernamePopup}
        label={props.t('Set your username')}
        faIcon='fas fa-at'
      >
        <div className='homepage__usernamePopup__body'>
          <div className='homepage__usernamePopup__body__title'>
            {props.t("Hello, you don't have a username yet!")}
          </div>

          <div className='homepage__usernamePopup__body__msg'>
            {props.t('Set your username:')}
          </div>

          <input
            className='homepage__usernamePopup__body__input form-control'
            type='text'
            placeholder={props.t('Your username')}
            value={this.state.newUsername}
            onChange={this.handleChangeNewUsername}
            data-cy='usernamePopup_username'
          />

          {!this.state.isUsernameValid && (
            <div className='homepage__usernamePopup__errorMsg'>
              <i className='homepage__usernamePopup__errorIcon fas fa-times' />
              {this.state.usernameInvalidMsg}
            </div>
          )}

          {this.state.isUsernameValid && (
            <div className='homepage__usernamePopup__infoMsg'>
              {props.t('Allowed characters: {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })}
            </div>
          )}

          {this.state.newUsername !== '' && (
            <>
              <div className='homepage__usernamePopup__body__msg'>
                {props.t('Please confirm your password:')}
              </div>

              <input
                className='homepage__usernamePopup__body__input form-control'
                type='password'
                placeholder={props.t('Password')}
                value={this.state.password}
                onChange={this.handleChangePassword}
                data-cy='usernamePopup_password'
              />
            </>
          )}

          {this.state.newUsername === '' && (
            <div>
              <div className='homepage__usernamePopup__body__checkbox'>
                <input
                  className='homepage__usernamePopup__body__checkbox__input'
                  type='checkbox'
                  onChange={this.handleClickCheckbox}
                />
                {props.t('Do not show this popup again')}
              </div>
              <div className='homepage__usernamePopup__body__smallmsg'>
                ({props.t('you can set your username on page My Account')})
              </div>
            </div>
          )}

          <IconButton
            customClass='homepage__usernamePopup__body__btn'
            disabled={this.disableConfirmButton}
            icon='fas fa-check'
            intent='primary'
            mode='light'
            text={props.t('Confirm')}
            onClick={this.handleClickConfirmUsernamePopup}
          />
        </div>
      </CardPopup>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(withRouter(appFactory(translate()(TracimComponent(CardPopupUsername)))))
