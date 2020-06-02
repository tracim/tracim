import React from 'react'
import { connect } from 'react-redux'
import * as Cookies from 'js-cookie'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../util/appFactory.js'
import {
  ALLOWED_CHARACTERS_USERNAME,
  COOKIE_FRONTEND,
  MINIMUM_CHARACTERS_USERNAME,
  workspaceConfig
} from '../util/helper.js'
import {
  buildHeadTitle,
  CUSTOM_EVENT,
  CardPopup,
  removeAtInUsername
} from 'tracim_frontend_lib'
import {
  getUsernameAvailability,
  putUserUsername
} from '../action-creator.async.js'
import {
  newFlashMessage,
  updateUserUsername
} from '../action-creator.sync.js'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import HomeNoWorkspace from '../component/Home/HomeNoWorkspace.jsx'
import HomeHasWorkspace from '../component/Home/HomeHasWorkspace.jsx'

export class Home extends React.Component {
  constructor (props) {
    super(props)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
    this.state = {
      hidePopupCheckbox: false,
      newUsername: '',
      newUsernameAvailability: true,
      password: '',
      usernamePopup: false
    }
  }

  customEventReducer = ({ detail: { type } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        this.setHeadTitle()
        break
    }
  }

  handleClickCreateWorkspace = e => {
    e.preventDefault()
    const { props } = this
    props.renderAppPopupCreation(workspaceConfig, props.user, null, null)
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
  }

  componentDidMount () {
    this.checkUsername()
    this.setHeadTitle()
  }

  setHeadTitle = () => {
    const { props } = this

    if (props.system.config.instance_name) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('Home'), props.system.config.instance_name]) }
      })
    }
  }

  checkUsername = () => {
    if (!(Cookies.get(COOKIE_FRONTEND.HIDE_USERNAME_POPUP) || this.props.user.username)) {
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
      const username = removeAtInUsername(state.newUsername)

      if (username.length < MINIMUM_CHARACTERS_USERNAME) {
        props.dispatch(
          newFlashMessage(props.t('Username must be at least {{minimumCharactersUsername}} characters', { minimumCharactersUsername: MINIMUM_CHARACTERS_USERNAME }), 'warning')
        )
        return false
      }

      if (/\s/.test(username)) {
        props.dispatch(newFlashMessage(props.t("Username can't contain any whitespace"), 'warning'))
        return false
      }

      const fetchPutUsername = await props.dispatch(putUserUsername(props.user, username, state.password))
      switch (fetchPutUsername.status) {
        case 200:
          props.dispatch(updateUserUsername(username))
          props.dispatch(newFlashMessage(props.t('Your username has been changed'), 'info'))
          break
        case 400:
          switch (fetchPutUsername.json.code) {
            case 2001:
              props.dispatch(newFlashMessage(props.t('Password must be at least 6 characters'), 'warning'))
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
    const { props } = this

    this.setState({ newUsername: e.target.value })

    const fetchUsernameAvailability = await props.dispatch(getUsernameAvailability(removeAtInUsername(e.target.value)))

    switch (fetchUsernameAvailability.status) {
      case 200:
        this.setState({ newUsernameAvailability: fetchUsernameAvailability.json.available })
        break
      default:
        props.dispatch(newFlashMessage(props.t('Error while checking username availability'), 'warning'))
        break
    }
  }

  handleChangePassword = e => this.setState({ password: e.target.value })

  disableConfirmButton = () => {
    const { state } = this

    return (
      (state.newUsername === '' && !state.hidePopupCheckbox) ||
      !state.newUsernameAvailability ||
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
                      onClickCreateWorkspace={this.handleClickCreateWorkspace}
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
                    placeholder={props.t('@username')}
                    value={this.state.newUsername}
                    onChange={this.handleChangeNewUsername}
                    data-cy='usernamePopup_username'
                  />

                  {!this.state.newUsernameAvailability && (
                    <div className='homepage__usernamePopup__errorMsg'>
                      <i className='homepage__usernamePopup__errorIcon fa fa-times' />
                      {props.t('This username is not available')}
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

                  <div className='homepage__usernamePopup__body__checkbox'>
                    <input
                      className='homepage__usernamePopup__body__checkbox__input'
                      type='checkbox'
                      onChange={this.handleClickCheckbox}
                    />
                    {props.t('Never ask me again')}
                  </div>
                  <div className='homepage__usernamePopup__body__smallmsg'>
                    ({props.t('you can always set your username in your account preferences')})
                  </div>

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

const mapStateToProps = ({ user, workspaceList, system }) => ({ user, workspaceList, system })
export default connect(mapStateToProps)(withRouter(appFactory(translate()(Home))))
