import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Redirect } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../util/appFactory.js'
import i18n from '../util/i18n.js'
import * as Cookies from 'js-cookie'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import {
  CUSTOM_EVENT,
  handleFetchResult,
  NUMBER_RESULTS_BY_PAGE,
  checkEmailValidity,
  PAGE,
  putUserConfiguration,
  serialize,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setUserConnected,
  setUserDisconnected,
  setWorkspaceList,
  setContentTypeList,
  setAppList,
  setConfig,
  resetBreadcrumbs,
  setUserConfiguration,
  setUserLang,
  setWorkspaceListMemberList,
  setUnreadMentionCount,
  setUnreadNotificationCount,
  setNotificationList,
  setNextPage,
  setHeadTitle,
  setAccessibleWorkspaceList
} from '../action-creator.sync.js'
import {
  getAppList,
  getConfig,
  getContentTypeList,
  getMyselfWorkspaceList,
  getNotificationList,
  getUsageConditions,
  getUserConfiguration,
  getUserMessagesSummary,
  getWorkspaceMemberList,
  postUserLogout,
  postUserLogin,
  putUserLang,
  getAccessibleWorkspaces,
  postUserRegister
} from '../action-creator.async.js'
import {
  COOKIE_FRONTEND,
  FETCH_CONFIG,
  MINIMUM_CHARACTERS_PUBLIC_NAME,
  WELCOME_ELEMENT_ID
} from '../util/helper.js'
import { serializeUserProps } from '../reducer/user.js'
import Conditions from './Conditions.jsx'
import SignIn from '../component/Login/SignIn.jsx'
import CreateAccount from '../component/Login/CreateAccount.jsx'

const qs = require('query-string')
const USAGE_CONDITIONS_STATUS = {
  ACCEPTED: 'accepted'
}
const DISPLAY = {
  CONDITIONS: 'Conditions',
  CREATE: 'CreateAccount',
  SIGN_IN: 'SignIn'
}

class Login extends React.Component {
  constructor (props) {
    super(props)

    // NOTE - SG - 2021-03-23 - the welcome DOM element is defined
    // statically in the loaded HTML page so that its content can be parsed by
    // search engines' robots.
    // A copy of its html is made in order to display it in this component (see render()).
    // The original welcome element is hidden unconditionally in Tracim.jsx
    const welcomeElement = document.getElementById(WELCOME_ELEMENT_ID)
    this.state = {
      displayedOption: DISPLAY.SIGN_IN,
      inputRememberMe: false,
      usageConditionsList: [],
      welcomeHtml: welcomeElement.innerHTML
    }

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        this.setHeadTitle()
        break
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { props, state } = this

    if (
      prevProps.system.config.instance_name !== props.system.config.instance_name ||
      (
        prevState.displayedOption !== state.displayedOption &&
        state.displayedOption === DISPLAY.SIGN_IN
      )
    ) {
      this.setHeadTitle()
    }
  }

  async componentDidMount () {
    const { props } = this

    this.setHeadTitle()

    props.dispatch(resetBreadcrumbs())

    const defaultLangCookie = Cookies.get(COOKIE_FRONTEND.DEFAULT_LANGUAGE)

    if (defaultLangCookie && defaultLangCookie !== 'null') {
      i18n.changeLanguage(defaultLangCookie)
      props.dispatch(setUserLang(defaultLangCookie))
    }

    const query = qs.parse(props.location.search)
    if (query.dc && query.dc === '1') {
      props.dispatch(newFlashMessage(props.t('You have been disconnected, please login again', 'warning')))
      props.history.push(props.location.pathname)
    }

    await this.loadConfig()
  }

  setHeadTitle = () => {
    const { props } = this
    props.dispatch(setHeadTitle(props.t('Log in')))
  }

  handleChangeRememberMe = e => {
    e.preventDefault()
    e.stopPropagation()
    this.setState(prev => ({ inputRememberMe: !prev.inputRememberMe }))
  }

  handleClickCreateAccount = async (event) => {
    const { props } = this

    event.preventDefault()

    const { name, login, password } = event.target

    if (name.value === '' || login.value === '' || password.value === '') {
      props.dispatch(newFlashMessage(props.t('All fields are required. Please enter a name, an email and a password.'), 'warning'))
      return
    }

    if (!checkEmailValidity(login.value)) {
      props.dispatch(newFlashMessage(props.t('Invalid email. Please enter a valid email.'), 'warning'))
      return
    }

    if (name.value.length < MINIMUM_CHARACTERS_PUBLIC_NAME) {
      props.dispatch(newFlashMessage(
        props.t('Full name must be at least {{minimumCharactersPublicName}} characters', { minimumCharactersPublicName: MINIMUM_CHARACTERS_PUBLIC_NAME }),
        'warning'))
      return
    }

    if (password.value.length < 6) {
      props.dispatch(newFlashMessage(props.t('New password is too short (minimum 6 characters)'), 'warning'))
      return
    }

    if (password.value.length > 512) {
      props.dispatch(newFlashMessage(props.t('New password is too long (maximum 512 characters)'), 'warning'))
      return
    }

    const fetchPostUserRegister = await props.dispatch(postUserRegister({
      email: login.value,
      password: password.value,
      public_name: name.value
    }))

    switch (fetchPostUserRegister.status) {
      case 200:
        this.handleClickSignIn({
          login: login,
          password: password

        })
        break
      case 400:
        switch (fetchPostUserRegister.json.code) {
          case 2001: props.dispatch(newFlashMessage(props.t('Invalid email'), 'warning')); break
          case 2036: props.dispatch(newFlashMessage(props.t('Email already exists'), 'warning')); break
          default: props.dispatch(newFlashMessage(props.t('Error while creating account'), 'warning')); break
        }
        break
      default: props.dispatch(newFlashMessage(props.t('Error while creating account'), 'warning')); break
    }
  }

  handleClickSignInEvent = async (event) => {
    event.preventDefault()
    this.handleClickSignIn({
      login: event.target.login,
      password: event.target.password
    })
  }

  handleClickSignIn = async (signInObject) => {
    const { props, state } = this

    const { login, password } = signInObject

    if (login.value === '' || password.value === '') {
      props.dispatch(newFlashMessage(props.t('Please enter a login and a password'), 'warning'))
      return
    }

    const credentials = {
      ...(checkEmailValidity(login.value) ? { email: login.value } : { username: login.value }),
      password: password.value
    }

    const fetchPostUserLogin = await props.dispatch(postUserLogin(credentials, state.inputRememberMe))

    switch (fetchPostUserLogin.status) {
      case 200: {
        const loggedUser = fetchPostUserLogin.json

        if (fetchPostUserLogin.json.lang === null) this.setDefaultUserLang(fetchPostUserLogin.json)

        Cookies.set(COOKIE_FRONTEND.LAST_CONNECTION, '1', { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
        props.dispatch(setUserConnected(loggedUser))
        props.dispatchCustomEvent(CUSTOM_EVENT.USER_CONNECTED, fetchPostUserLogin.json)

        Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, fetchPostUserLogin.json.lang, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
        i18n.changeLanguage(loggedUser.lang)

        this.loadAppList()
        this.loadContentTypeList()
        this.loadWorkspaceLists()
        this.loadNotificationNotRead(loggedUser.user_id)
        this.loadNotificationList(loggedUser.user_id)
        this.loadUserConfiguration(loggedUser.user_id)
        break
      }
      case 400:
        switch (fetchPostUserLogin.json.code) {
          case 2001: props.dispatch(newFlashMessage(props.t('Invalid email or username'), 'warning')); break
          default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning')); break
        }
        break
      case 403: props.dispatch(newFlashMessage(props.t('Invalid credentials'), 'warning')); break
      default: props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning')); break
    }
  }

  handleUserConnection = async () => {
    const { props } = this

    if (window.Notification) {
      try {
        if (Notification.permission !== 'denied') {
          const permission = Notification.requestPermission()
        }
      } catch (e) {
        console.error('Could not show notification', e)
      }
    }

    props.dispatch(setUserConnected({ ...props.user, logged: true }))
    if (props.system.redirectLogin !== '') {
      props.history.push(props.system.redirectLogin)
      return
    }

    const fetchPutUserConfiguration = await handleFetchResult(await putUserConfiguration(
      FETCH_CONFIG.apiUrl,
      props.user.userId,
      { ...props.user.config, usage_conditions__status: USAGE_CONDITIONS_STATUS.ACCEPTED }
    ))

    if (fetchPutUserConfiguration.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while saving the user configuration')))
    }

    props.history.push(PAGE.HOME)
  }

  handleClickLogout = async () => {
    const { props } = this

    const fetchPostUserLogout = await props.dispatch(postUserLogout())
    if (fetchPostUserLogout.status === 204) {
      props.dispatch(setUserDisconnected())
      props.dispatchCustomEvent(CUSTOM_EVENT.USER_DISCONNECTED, {})
      this.setState({
        usageConditionsList: [],
        displayedOption: DISPLAY.SIGN_IN
      })
    } else {
      props.dispatch(newFlashMessage(props.t('Disconnection error', 'danger')))
    }
  }

  loadConfig = async () => {
    const { props } = this

    const fetchGetConfig = await props.dispatch(getConfig())
    if (fetchGetConfig.status === 200) props.dispatch(setConfig(fetchGetConfig.json))
  }

  loadAppList = async () => {
    const { props } = this

    const fetchGetAppList = await props.dispatch(getAppList())
    if (fetchGetAppList.status === 200) props.dispatch(setAppList(fetchGetAppList.json))
  }

  loadContentTypeList = async () => {
    const { props } = this

    const fetchGetContentTypeList = await props.dispatch(getContentTypeList())
    if (fetchGetContentTypeList.status === 200) props.dispatch(setContentTypeList(fetchGetContentTypeList.json))
  }

  loadWorkspaceLists = async () => {
    const { props } = this
    const showOwnedWorkspace = false

    const fetchGetWorkspaceList = await props.dispatch(getMyselfWorkspaceList(showOwnedWorkspace))
    if (fetchGetWorkspaceList.status === 200) {
      props.dispatch(setWorkspaceList(fetchGetWorkspaceList.json))
      this.loadWorkspaceListMemberList(fetchGetWorkspaceList.json)
    }

    const fetchAccessibleWorkspaceList = await props.dispatch(getAccessibleWorkspaces(props.user.userId))
    if (fetchAccessibleWorkspaceList.status !== 200) return
    props.dispatch(setAccessibleWorkspaceList(fetchAccessibleWorkspaceList.json))
  }

  loadWorkspaceListMemberList = async workspaceList => {
    const { props } = this

    const fetchWorkspaceListMemberList = await Promise.all(
      workspaceList.map(async ws => ({
        workspaceId: ws.workspace_id,
        fetchMemberList: await props.dispatch(getWorkspaceMemberList(ws.workspace_id))
      }))
    )

    const workspaceListMemberList = fetchWorkspaceListMemberList.map(memberList => ({
      workspaceId: memberList.workspaceId,
      memberList: memberList.fetchMemberList.status === 200 ? memberList.fetchMemberList.json : []
    }))

    props.dispatch(setWorkspaceListMemberList(workspaceListMemberList))
  }

  loadUserConfiguration = async userId => {
    const { props } = this

    const fetchGetUserConfig = await props.dispatch(getUserConfiguration(userId))
    switch (fetchGetUserConfig.status) {
      case 200: {
        props.dispatch(setUserConfiguration(fetchGetUserConfig.json.parameters))

        if (fetchGetUserConfig.json.parameters.usage_conditions__status !== USAGE_CONDITIONS_STATUS.ACCEPTED) {
          const fetchGetUsageConditions = await props.dispatch(getUsageConditions())
          switch (fetchGetUsageConditions.status) {
            case 200: {
              if (fetchGetUsageConditions.json.items.length === 0) this.handleUserConnection()
              else {
                this.setState({
                  usageConditionsList: fetchGetUsageConditions.json.items,
                  displayedOption: DISPLAY.CONDITIONS
                })
              }
              break
            }
            default: props.dispatch(newFlashMessage(props.t('Error while loading the usage conditions'))); break
          }
        } else {
          this.handleUserConnection()
        }
        break
      }
      default: props.dispatch(newFlashMessage(props.t('Error while loading the user configuration')))
    }
  }

  loadNotificationNotRead = async (userId) => {
    const { props } = this

    const fetchUnreadMentionCount = await props.dispatch(getUserMessagesSummary(userId, [
      `${TLM_ET.MENTION}.${TLM_CET.CREATED}`
    ]))
    switch (fetchUnreadMentionCount.status) {
      case 200: props.dispatch(setUnreadMentionCount(fetchUnreadMentionCount.json.unread_messages_count)); break
      default: props.dispatch(newFlashMessage(props.t('Error loading unread mention number')))
    }

    const fetchUnreadMessageCount = await props.dispatch(getUserMessagesSummary(userId))
    switch (fetchUnreadMessageCount.status) {
      case 200: props.dispatch(setUnreadNotificationCount(fetchUnreadMessageCount.json.unread_messages_count)); break
      default: props.dispatch(newFlashMessage(props.t('Error loading unread mention number')))
    }
  }

  loadNotificationList = async (userId) => {
    const { props } = this

    const fetchGetNotificationWall = await props.dispatch(getNotificationList(
      userId,
      {
        excludeAuthorId: userId,
        notificationsPerPage: NUMBER_RESULTS_BY_PAGE
      }
    ))
    switch (fetchGetNotificationWall.status) {
      case 200:
        props.dispatch(setNotificationList(fetchGetNotificationWall.json.items))
        props.dispatch(setNextPage(fetchGetNotificationWall.json.has_next, fetchGetNotificationWall.json.next_page_token))
        break
      default:
        props.dispatch(newFlashMessage(props.t('Error while loading the notification list'), 'warning'))
        break
    }
  }

  setDefaultUserLang = async loggedUser => {
    const { props } = this
    const fetchPutUserLang = await props.dispatch(putUserLang(serialize(loggedUser, serializeUserProps), props.user.lang))
    switch (fetchPutUserLang.status) {
      case 200: break
      default: props.dispatch(newFlashMessage(props.t('Error while saving your language')))
    }
  }

  render () {
    const { props, state } = this
    if (props.user.logged) return <Redirect to={{ pathname: '/ui' }} />

    return (
      <div className='loginpage'>
        <div className='loginpage__welcome' dangerouslySetInnerHTML={{ __html: state.welcomeHtml }} />
        <section className='loginpage__main'>
          {state.displayedOption === DISPLAY.SIGN_IN && (
            <SignIn
              onClickCreateAccount={() => this.setState({ displayedOption: DISPLAY.CREATE })}
              onClickSubmit={this.handleClickSignInEvent}
            />
          )}

          {state.displayedOption === DISPLAY.CONDITIONS && (
            <Conditions
              onClickCancel={this.handleClickLogout}
              onClickValidate={this.handleUserConnection}
              usageConditionsList={state.usageConditionsList}
            />
          )}

          {state.displayedOption === DISPLAY.CREATE && (
            <CreateAccount
              onClickSignIn={() => this.setState({ displayedOption: DISPLAY.SIGN_IN })}
              onClickCreateAccount={this.handleClickCreateAccount}
            />
          )}
          <FooterLogin />
        </section>
      </div>
    )
  }
}

const mapStateToProps = ({ user, system, breadcrumbs, tlm }) => ({ user, system, breadcrumbs, tlm })
export default withRouter(connect(mapStateToProps)(translate()(appFactory(Login))))
