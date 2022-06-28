import React from 'react'
import { connect } from 'react-redux'
import * as Cookies from 'js-cookie'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../util/appFactory.js'
import debounce from 'lodash/debounce'

import {
  COOKIE_FRONTEND,
  FETCH_CONFIG
} from '../util/helper.js'
import {
  CardPopup,
  IconButton,
  TracimComponent,
  handleFetchResult,
  putUserConfiguration,
  ALLOWED_CHARACTERS_USERNAME,
  MAXIMUM_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME,
  checkUsernameValidity,
  CHECK_USERNAME_DEBOUNCE_WAIT
} from 'tracim_frontend_lib'
import { putUserUsername } from '../action-creator.async.js'
import { newFlashMessage } from '../action-creator.sync.js'
const DISPLAY_USERNAME_POPUP = {
  FALSE: 'false'
}

export class CardPopupUsername extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      hidePopupCheckbox: false,
      newUsername: '',
      isUsernameValid: true,
      password: '',
      usernameInvalidMsg: '',
      shouldDisplay: true
    }
  }

  componentWillUnmount () {
    this.debouncedCheckUsername.cancel()
  }

  handleClickCloseUsernamePopup = () => {
    Cookies.set(COOKIE_FRONTEND.SHOW_USERNAME_POPUP, false, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
    this.setState({ shouldDisplay: false })
  }

  handleClickConfirmUsernamePopup = async () => {
    const { props, state } = this

    if (state.newUsername === '') {
      await handleFetchResult(await putUserConfiguration(
        FETCH_CONFIG.apiUrl,
        props.user.userId,
        { ...props.user.config, display_username_popup: DISPLAY_USERNAME_POPUP.FALSE }
      ))
      Cookies.set(COOKIE_FRONTEND.SHOW_USERNAME_POPUP, false, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
      this.setState({ shouldDisplay: false })
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
    }
    this.handleClickCloseUsernamePopup()
  }

  checkUsername = async () => {
    const { props, state } = this

    if (!state.newUsername) {
      this.setState({ isUsernameValid: true, usernameInvalidMsg: '' })
      return
    }

    try {
      this.setState(await checkUsernameValidity(FETCH_CONFIG.apiUrl, state.newUsername, props))
    } catch (errorWhileChecking) {
      props.dispatch(newFlashMessage(errorWhileChecking.message, 'warning'))
    }
  }

  debouncedCheckUsername = debounce(this.checkUsername, CHECK_USERNAME_DEBOUNCE_WAIT)

  handleChangeNewUsername = e => {
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
    const { props, state } = this

    if (!state.shouldDisplay) return null

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
            value={state.newUsername}
            onChange={this.handleChangeNewUsername}
            data-cy='usernamePopup_username'
          />

          {!state.isUsernameValid && (
            <div className='homepage__usernamePopup__errorMsg'>
              <i className='homepage__usernamePopup__errorIcon fas fa-times' />
              {state.usernameInvalidMsg}
            </div>
          )}

          {state.isUsernameValid && (
            <div className='homepage__usernamePopup__infoMsg'>
              {props.t('Allowed characters: {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })}
            </div>
          )}

          {state.newUsername !== '' && (
            <>
              <div className='homepage__usernamePopup__body__msg'>
                {props.t('Please confirm your password:')}
              </div>

              <input
                className='homepage__usernamePopup__body__input form-control'
                type='password'
                placeholder={props.t('Password')}
                value={state.password}
                onChange={this.handleChangePassword}
                data-cy='usernamePopup_password'
              />
            </>
          )}

          {state.newUsername === '' && (
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
            disabled={this.disableConfirmButton()}
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
