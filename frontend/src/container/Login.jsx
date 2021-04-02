import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Redirect, Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../util/appFactory.js'
import i18n from '../util/i18n.js'
import * as Cookies from 'js-cookie'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import Button from '../component/common/Input/Button.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import {
  CUSTOM_EVENT,
  NUMBER_RESULTS_BY_PAGE,
  checkEmailValidity,
  PAGE,
  serialize
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setUserConnected,
  setWorkspaceList,
  setContentTypeList,
  setAppList,
  setConfig,
  resetBreadcrumbs,
  setUserConfiguration,
  setUserLang,
  setWorkspaceListMemberList,
  setNotificationNotReadCounter,
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
  getUserConfiguration,
  getUserMessagesSummary,
  getWorkspaceMemberList,
  postUserLogin,
  putUserLang,
  getAccessibleWorkspaces
} from '../action-creator.async.js'
import { COOKIE_FRONTEND, WELCOME_ELEMENT_ID } from '../util/helper.js'
import { serializeUserProps } from '../reducer/user.js'

const qs = require('query-string')

class Login extends React.Component {
  constructor (props) {
    super(props)

    // NOTE - SG - 2021-03-23 - the welcome DOM element is defined
    // statically in the loaded HTML page so that its content can be parsed by
    // search engines' robots.
    // A copy of its html is made in order to display it in this component (see render()).
    // Then the original element is also hidden in Tracim.jsx as it is not used visually and this component
    // is not rendered when the user is already logged in.
    const welcomeElement = document.getElementById(WELCOME_ELEMENT_ID)
    welcomeElement.hidden = false
    this.state = {
      inputRememberMe: false,
      welcomeHtml: welcomeElement.innerHTML
    }
    welcomeElement.hidden = true

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
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
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
    props.dispatch(setHeadTitle(props.t('Login')))
  }

  handleChangeRememberMe = e => {
    e.preventDefault()
    e.stopPropagation()
    this.setState(prev => ({ inputRememberMe: !prev.inputRememberMe }))
  }

  handleClickSubmit = async (event) => {
    const { props, state } = this

    event.preventDefault()

    const { login, password } = event.target

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
        const loggedUser = {
          ...fetchPostUserLogin.json,
          logged: true
        }

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

        if (props.system.redirectLogin !== '') {
          props.history.push(props.system.redirectLogin)
          return
        }

        props.history.push(PAGE.HOME)
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
      case 200: props.dispatch(setUserConfiguration(fetchGetUserConfig.json.parameters)); break
      default: props.dispatch(newFlashMessage(props.t('Error while loading the user configuration')))
    }
  }

  loadNotificationNotRead = async (userId) => {
    const { props } = this

    const fetchNotificationNotRead = await props.dispatch(getUserMessagesSummary(userId))

    switch (fetchNotificationNotRead.status) {
      case 200: props.dispatch(setNotificationNotReadCounter(fetchNotificationNotRead.json.unread_messages_count)); break
      default: props.dispatch(newFlashMessage(props.t('Error loading unread notification number')))
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
          <div className='loginpage__main__wrapper'>
            <h1 className='loginpage__main__title'>{props.t('Sign in')}</h1>
            <form onSubmit={this.handleClickSubmit} noValidate className='loginpage__main__form'>
              <div>{props.t('Login:')}</div>
              <InputGroupText
                parentClassName='loginpage__main__form__groupelogin'
                icon='fa-user'
                type='text'
                placeHolder={props.t('Email address or username')}
                invalidMsg={props.t('Invalid email or username')}
                maxLength={512}
                name='login'
              />
              <div>{props.t('Password:')}</div>
              <InputGroupText
                parentClassName='loginpage__main__form__groupepw'
                customClass=''
                icon='fa-lock'
                type='password'
                placeHolder={props.t('Password')}
                invalidMsg={props.t('Invalid password')}
                maxLength={512}
                name='password'
              />

              <Link
                className='loginpage__main__form__forgot_password'
                to={props.system.config.email_notification_activated
                  ? PAGE.FORGOT_PASSWORD
                  : PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF}
              >
                {props.t('Forgotten password?')}
              </Link>

              <Button
                htmlType='submit'
                bootstrapType=''
                customClass='highlightBtn primaryColorBg primaryColorBgDarkenHover loginpage__main__form__btnsubmit ml-auto'
                label={props.t('Connection')}
              />
            </form>
          </div>
          <FooterLogin />
        </section>
      </div>
    )
  }
}

const mapStateToProps = ({ user, system, breadcrumbs, tlm }) => ({ user, system, breadcrumbs, tlm })
export default withRouter(connect(mapStateToProps)(translate()(appFactory(Login))))
