import React from 'react'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import * as Cookies from 'js-cookie'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../util/appFactory.js'

import {
  COOKIE_FRONTEND,
  workspaceConfig,
  FETCH_CONFIG
} from '../util/helper.js'
import {
  CUSTOM_EVENT,
  CardPopup,
  TracimComponent,
  checkUsernameValidity,
  ALLOWED_CHARACTERS_USERNAME,
  MAXIMUM_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME,
  CHECK_USERNAME_DEBOUNCE_WAIT,
  PAGE
} from 'tracim_frontend_lib'
import {
  putUserUsername
} from '../action-creator.async.js'
import { newFlashMessage, setHeadTitle } from '../action-creator.sync.js'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import HomeNoWorkspace from '../component/Home/HomeNoWorkspace.jsx'
import HomeHasWorkspace from '../component/Home/HomeHasWorkspace.jsx'

export class Home extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      hidePopupCheckbox: false,
      newUsername: '',
      isUsernameValid: true,
      password: '',
      usernamePopup: false,
      usernameInvalidMsg: ''
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  handleAllAppChangeLanguage = () => this.setHeadTitle()

  handleClickCreateWorkspace = e => {
    e.preventDefault()
    const { props } = this
    props.renderAppPopupCreation(workspaceConfig, props.user, null, null)
  }

  handleClickJoinWorkspace = () => {
    this.props.history.push(PAGE.JOIN_WORKSPACE)
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
  }

  componentDidMount () {
    this.setUsernamePopupVisibility()
    this.setHeadTitle()
  }

  componentWillUnmount () {
    this.debouncedCheckUsernameValidity.cancel()
  }

  setHeadTitle = () => {
    const { props } = this

    props.dispatch(setHeadTitle(props.t('Home')))
  }

  setUsernamePopupVisibility () {
    if (!(this.props.user.username || Cookies.get(COOKIE_FRONTEND.HIDE_USERNAME_POPUP))) {
      this.setState({ usernamePopup: true })
    }
  }

  handleClickCloseUsernamePopup = () => {
    this.setState(prevState => ({ usernamePopup: !prevState.usernamePopup }))
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

  handleClickCheckbox = () => {
    this.setState(prevState => ({ hidePopupCheckbox: !prevState.hidePopupCheckbox }))
  }

  handleChangeNewUsername = async e => {
    const username = e.target.value
    this.setState({ newUsername: username })
    this.debouncedCheckUsernameValidity(username)
  }

  checkUsernameValidity = async (username) => {
    if (!username) {
      this.setState({ isUsernameValid: true, usernameInvalidMsg: '' })
      return
    }
    const { props } = this
    try {
      this.setState(await checkUsernameValidity(FETCH_CONFIG.apiUrl, this.state.newUsername, props))
    } catch (errorWhileChecking) {
      props.dispatch(newFlashMessage(errorWhileChecking.message, 'warning'))
    }
  }

  debouncedCheckUsernameValidity = debounce(checkUsernameValidity, CHECK_USERNAME_DEBOUNCE_WAIT)

  handleChangePassword = e => this.setState({ password: e.target.value })

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

    if (!props.system.workspaceListLoaded) return null

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview fullWidthFullHeight'>
          <section
            className='homepage'
            style={{ backgroundColor: props.workspaceList.length === 0 ? 'gray' : 'white' }}
          >
            <Card customClass='homepagecard'>
              <CardHeader displayHeader={false} />

              <CardBody formClass='homepagecard__body'>
                {(props.workspaceList.length > 0
                  ? (
                    <HomeHasWorkspace user={props.user} />
                  )
                  : (
                    <HomeNoWorkspace
                      canCreateWorkspace={props.canCreateWorkspace}
                      canJoinWorkspace={props.accessibleWorkspaceList.length > 0}
                      onClickCreateWorkspace={this.handleClickCreateWorkspace}
                      onClickJoinWorkspace={this.handleClickJoinWorkspace}
                    />
                  )
                )}
              </CardBody>
            </Card>
            {(this.state.usernamePopup &&
              <CardPopup
                customClass='homepage__usernamePopup'
                customHeaderClass='primaryColorBg'
                onClose={this.handleClickCloseUsernamePopup}
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
                      <i className='homepage__usernamePopup__errorIcon fa fa-times' />
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

                  <button
                    type='button'
                    className='homepage__usernamePopup__body__btn btn highlightBtn primaryColorBg primaryColorBgDarkenHover'
                    onClick={this.handleClickConfirmUsernamePopup}
                    disabled={this.disableConfirmButton()}
                  >
                    {props.t('Confirm')}
                  </button>
                </div>
              </CardPopup>
            )}
          </section>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList, system, accessibleWorkspaceList }) => ({ user, workspaceList, system, accessibleWorkspaceList })
export default connect(mapStateToProps)(withRouter(appFactory(translate()(TracimComponent(Home)))))
