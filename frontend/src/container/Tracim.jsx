import React from 'react'
import { connect } from 'react-redux'
import { translate, Trans } from 'react-i18next'
import * as Cookies from 'js-cookie'
import i18n from '../util/i18n.js'
import { isEqual } from 'lodash'
import {
  Route, withRouter, Redirect
} from 'react-router-dom'
import Dashboard from './Dashboard.jsx'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import Login from './Login.jsx'
import ForgotPassword from './ForgotPassword.jsx'
import ForgotPasswordNoEmailNotif from './ForgotPasswordNoEmailNotif.jsx'
import ResetPassword from './ResetPassword.jsx'
import Account from './Account.jsx'
import AdminAccount from './AdminAccount.jsx'
import AppFullscreenRouter from './AppFullscreenRouter.jsx'
import FlashMessage from '../component/FlashMessage.jsx'
import WorkspaceContent from './WorkspaceContent.jsx'
import OpenWorkspaceAdvanced from '../component/Workspace/OpenWorkspaceAdvanced.jsx'
import Home from './Home.jsx'
import WIPcomponent from './WIPcomponent.jsx'
import {
  CUSTOM_EVENT,
  PROFILE,
  NUMBER_RESULTS_BY_PAGE,
  formatAbsoluteDate,
  serialize,
  CardPopup,
  IconButton,
  TracimComponent,
  buildHeadTitle,
  LiveMessageManager,
  LIVE_MESSAGE_STATUS,
  LIVE_MESSAGE_ERROR_CODE,
  PAGE,
  USER_CALL_STATE,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET
} from 'tracim_frontend_lib'
import {
  COOKIE_FRONTEND,
  FETCH_CONFIG,
  SEARCH_TYPE,
  WELCOME_ELEMENT_ID,
  getUserProfile,
  toggleFavicon,
  unLoggedAllowedPageList
} from '../util/helper.js'
import {
  logoutUser,
  getAppList,
  getConfig,
  getContentTypeList,
  getWorkspaceMemberList,
  getMyselfWorkspaceList,
  getNotificationList,
  getUserConfiguration,
  getUserIsConnected,
  putUserLang,
  getUserMessagesSummary,
  getAccessibleWorkspaces,
  putSetIncomingUserCallState,
  putSetOutgoingUserCallState,
  postCreateUserCall
} from '../action-creator.async.js'
import {
  newFlashMessage,
  removeFlashMessage,
  setConfig,
  setAppList,
  setContentTypeList,
  setNextPage,
  setNotificationList,
  setUserConfiguration,
  setUserConnected,
  setWorkspaceList,
  setBreadcrumbs,
  appendBreadcrumbs,
  setWorkspaceListMemberList,
  setUnreadMentionCount,
  setUnreadNotificationCount,
  setHeadTitle,
  setAccessibleWorkspaceList
} from '../action-creator.sync.js'
import NotificationWall from './NotificationWall.jsx'
import AdvancedSearch from './AdvancedSearch.jsx'
import SimpleSearch from './SimpleSearch.jsx'
import GuestUpload from './GuestUpload.jsx'
import GuestDownload from './GuestDownload.jsx'
import { serializeUserProps } from '../reducer/user.js'
import ReduxTlmDispatcher from './ReduxTlmDispatcher.jsx'
import JoinWorkspace from './JoinWorkspace.jsx'
import PersonalRecentActivities from './PersonalRecentActivities.jsx'
import PublicProfile from './PublicProfile.jsx'
import Publications from './Publications.jsx'
import Favorites from './Favorites.jsx'
import ContentRedirection from './ContentRedirection.jsx'
import WorkspacePage from './WorkspacePage.jsx'

const CONNECTION_MESSAGE_DISPLAY_DELAY_MS = 4000
const UNANSWERED_CALL_TIMEOUT = 120000 // 2 minutes

export class Tracim extends React.Component {
  constructor (props) {
    super(props)
    this.connectionErrorDisplayTimeoutId = 0
    this.state = {
      displayConnectionError: false,
      isNotificationWallOpen: false,
      displayCallPopup: false,
      displayedUserId: 0,
      userCall: undefined,
      unansweredCallTimeoutId: -1
    }

    this.audioCall = new Audio('/assets/branding/incoming-call.ogg')
    this.liveMessageManager = new LiveMessageManager()

    // NOTE - S.G. - Unconditionally hide the original welcome element
    // so that it does not interfere with Tracim render.
    // It is not done statically in index.mak because search engine robots have a tendency to
    // ignore hidden elements…
    const welcomeElement = document.getElementById(WELCOME_ELEMENT_ID)
    if (welcomeElement) welcomeElement.hidden = true

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.REDIRECT, handler: this.handleRedirect },
      { name: CUSTOM_EVENT.ADD_FLASH_MSG, handler: this.handleAddFlashMessage },
      { name: CUSTOM_EVENT.DISCONNECTED_FROM_API, handler: this.handleDisconnectedFromApi },
      { name: CUSTOM_EVENT.REFRESH_WORKSPACE_LIST_THEN_REDIRECT, handler: this.handleRefreshWorkspaceListThenRedirect },
      { name: CUSTOM_EVENT.SET_BREADCRUMBS, handler: this.handleSetBreadcrumbs },
      { name: CUSTOM_EVENT.APPEND_BREADCRUMBS, handler: this.handleAppendBreadcrumbs },
      { name: CUSTOM_EVENT.SET_HEAD_TITLE, handler: this.handleSetHeadTitle },
      { name: CUSTOM_EVENT.TRACIM_LIVE_MESSAGE_STATUS_CHANGED, handler: this.handleTlmStatusChanged },
      { name: CUSTOM_EVENT.USER_CONNECTED, handler: this.handleUserConnected },
      { name: CUSTOM_EVENT.USER_DISCONNECTED, handler: this.handleUserDisconnected }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserCallModified },
      { entityType: TLM_ET.USER_CALL, coreEntityType: TLM_CET.CREATED, handler: this.handleUserCallCreated }
    ])
  }

  handleUserCallCreated = async (tlm) => {
    const { props } = this
    const bell = '🔔'
    const isMainTab = this.liveMessageManager.eventSource !== null

    if (tlm.fields.user_call.callee.user_id === props.user.userId) {
      if (window.Notification) {
        const notificationString = tlm.fields.user_call.caller.public_name + props.t(' is calling you on Tracim')
        const notificationOptions = { tag: 'call', renotify: true, requireInteraction: true }

        try {
          if (Notification.permission === 'granted') {
            new Notification(notificationString, notificationOptions) // eslint-disable-line no-new
          } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
              new Notification(notificationString, notificationOptions) // eslint-disable-line no-new
            }
          }
        } catch (e) {
          console.error("Could not show notification", e)
        }
      }

      this.setState({ userCall: tlm.fields.user_call })
      this.handleSetHeadTitle({ title: props.system.headTitle }, bell)

      if (!isMainTab) return

      this.audioCall.addEventListener('ended', function () {
        this.currentTime = 0
        this.play()
      }, false)
      this.audioCall.play()
    }
    if (tlm.fields.user_call.caller.user_id === props.user.userId) {
      this.setState({ userCall: tlm.fields.user_call })
    }
  }

  handleSetHeadTitle = (data, titlePrefix = '') => {
    const { props } = this
    console.log('%c<Tracim> Custom event SETHEADTITLE', 'color: #28a745', CUSTOM_EVENT.SET_HEAD_TITLE, data)
    props.dispatch(setHeadTitle(data.title, titlePrefix))
  }

  handleClickOpenCallWindowCallee = () => {
    const { state, props } = this
    props.dispatch(putSetIncomingUserCallState(props.user.userId, state.userCall.call_id, USER_CALL_STATE.ACCEPTED))
    this.handleSetHeadTitle({ title: props.system.headTitle })
    this.audioCall.pause()
  }

  handleClickRejectCall = () => {
    const { props, state } = this
    props.dispatch(putSetIncomingUserCallState(props.user.userId, state.userCall.call_id, USER_CALL_STATE.REJECTED))
    this.handleSetHeadTitle({ title: props.system.headTitle })
    this.audioCall.pause()
  }

  handleClickDeclineCall = () => {
    const { props, state } = this
    props.dispatch(putSetIncomingUserCallState(props.user.userId, state.userCall.call_id, USER_CALL_STATE.DECLINED))
    this.audioCall.pause()
    this.handleSetHeadTitle({ title: props.system.headTitle })
  }

  handleUserCallModified = (tlm) => {
    const { props, state } = this
    const isMainTab = this.liveMessageManager.eventSource !== null
    if (tlm.fields.user_call.callee.user_id === props.user.userId) {
      this.setState({ userCall: undefined })

      if (tlm.fields.user_call.state === USER_CALL_STATE.ACCEPTED) {
        this.handleSetHeadTitle({ title: props.system.headTitle })
        this.audioCall.pause()
        if (!isMainTab) return
      }
      if (tlm.fields.user_call.state === (USER_CALL_STATE.CANCELLED)) {
        this.audioCall.pause()
        this.handleSetHeadTitle({ title: props.system.headTitle })
      }
      if (tlm.fields.user_call.state === USER_CALL_STATE.REJECTED) {
        this.audioCall.pause()
        this.handleSetHeadTitle({ title: props.system.headTitle })
      }
      if (tlm.fields.user_call.state === USER_CALL_STATE.DECLINED) {
        this.audioCall.pause()
        this.handleSetHeadTitle({ title: props.system.headTitle })
      }
      if (tlm.fields.user_call.state === USER_CALL_STATE.UNANSWERED) {
        this.audioCall.pause()
        this.handleSetHeadTitle({ title: props.system.headTitle })
      }
    }
    if (tlm.fields.user_call.caller.user_id === props.user.userId) {
      clearTimeout(state.unansweredCallTimeoutId)
      this.setState({
        userCall: tlm.fields.user_call,
        displayedUserId: tlm.fields.user_call.callee.user_id,
        unansweredCallTimeoutId: -1
      })
      if (tlm.fields.user_call.state === USER_CALL_STATE.ACCEPTED) {
        if (!isMainTab) return
        window.open(tlm.fields.user_call.url)
      }
    }
  }

  handleClosePopup = () => {
    this.setState({ userCall: undefined })
  }

  handleClickRetryButton = async () => {
    const { props, state } = this
    await props.dispatch(postCreateUserCall(props.user.userId, state.displayedUserId))
    const setUserCallUnanswered = () => {
      const { props, state } = this
      props.dispatch(putSetOutgoingUserCallState(props.user.userId, state.userCall.call_id, USER_CALL_STATE.UNANSWERED))
    }
    const id = setTimeout(setUserCallUnanswered, UNANSWERED_CALL_TIMEOUT)
    this.setState({ unansweredCallTimeoutId: id })
  }

  handleClickCancelButton = async () => {
    const { props, state } = this
    await props.dispatch(putSetOutgoingUserCallState(props.user.userId, state.userCall.call_id, USER_CALL_STATE.CANCELLED))
    this.audioCall.pause()
  }

  handleClickLogout = async () => {
    await this.props.dispatch(logoutUser(this.props.history))
    this.setState({ tooManyUsers: false })
  }

  handleRedirect = data => {
    console.log('%c<Tracim> Custom event', 'color: #28a745', CUSTOM_EVENT.REDIRECT, data)
    this.props.history.push(data.url)
  }

  handleAddFlashMessage = data => {
    console.log('%c<Tracim> Custom event', 'color: #28a745', CUSTOM_EVENT.ADD_FLASH_MSG, data)
    this.props.dispatch(newFlashMessage(data.msg, data.type, data.delay))
  }

  handleDisconnectedFromApi = data => {
    console.log('%c<Tracim> Custom event', 'color: #28a745', CUSTOM_EVENT.DISCONNECTED_FROM_API, data)
    this.handleUserDisconnected(data)
    if (!document.location.pathname.includes('/login')) document.location.href = `${PAGE.LOGIN}?dc=1`
  }

  handleUserConnected = data => {
    console.log('%c<Tracim> Custom event', 'color: #28a745', CUSTOM_EVENT.USER_CONNECTED, data)
    this.liveMessageManager.openLiveMessageConnection(data.user_id, FETCH_CONFIG.apiUrl)
  }

  handleUserDisconnected = data => {
    this.liveMessageManager.closeLiveMessageConnection()
  }

  handleTlmStatusChanged = (data) => {
    console.log('%c<Tracim> Custom event', 'color: #28a745', CUSTOM_EVENT.TRACIM_LIVE_MESSAGE_STATUS_CHANGED, data)
    const { status, code } = data

    if (status === LIVE_MESSAGE_STATUS.OPENED || status === LIVE_MESSAGE_STATUS.CLOSED) {
      globalThis.clearTimeout(this.connectionErrorDisplayTimeoutId)
      this.connectionErrorDisplayTimeoutId = 0

      if (this.state.displayConnectionError) {
        this.setState({ displayConnectionError: false })
      }
    } else if (status === LIVE_MESSAGE_STATUS.ERROR && code === LIVE_MESSAGE_ERROR_CODE.TOO_MANY_ONLINE_USERS) {
      this.setState({ tooManyUsers: true })
    } else if (!this.connectionErrorDisplayTimeoutId) {
      this.connectionErrorDisplayTimeoutId = globalThis.setTimeout(
        this.displayConnectionError,
        CONNECTION_MESSAGE_DISPLAY_DELAY_MS
      )
    }
  }

  displayConnectionError = () => {
    this.setState({ displayConnectionError: true })
  }

  handleRefreshWorkspaceListThenRedirect = async data => { // Côme - 2018/09/28 - @fixme this is a hack to force the redirection AFTER the workspaceList is loaded
    await this.loadWorkspaceLists()
    this.props.history.push(data.url)
  }

  handleSetBreadcrumbs = data => {
    console.log('%c<Tracim> Custom event', 'color: #28a745', CUSTOM_EVENT.SET_BREADCRUMBS, data)
    this.props.dispatch(setBreadcrumbs(data.breadcrumbs))
  }

  handleAppendBreadcrumbs = data => {
    console.log('%c<Tracim> Custom event', 'color: #28a745', CUSTOM_EVENT.APPEND_BREADCRUMBS, data)
    this.props.dispatch(appendBreadcrumbs(data.breadcrumbs))
  }

  handleUserDisconnected = () => {
    this.setState({ isNotificationWallOpen: false })
  }

  async componentDidMount () {
    // console.log('<Tracim> did Mount')
    const { props } = this

    const fetchGetUserIsConnected = await props.dispatch(getUserIsConnected())
    switch (fetchGetUserIsConnected.status) {
      case 200: {
        const fetchUser = fetchGetUserIsConnected.json

        if (fetchUser.lang === null) this.setDefaultUserLang(fetchGetUserIsConnected.json)

        props.dispatch(setUserConnected({
          ...fetchUser,
          logged: true
        }))

        Cookies.set(COOKIE_FRONTEND.LAST_CONNECTION, '1', { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
        Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, fetchUser.lang, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })

        i18n.changeLanguage(fetchUser.lang)

        this.loadAppConfig()
        this.loadWorkspaceLists()
        this.loadNotificationNotRead(fetchUser.user_id)
        this.loadNotificationList(fetchUser.user_id)
        this.loadUserConfiguration(fetchUser.user_id)

        this.liveMessageManager.openLiveMessageConnection(fetchUser.user_id, FETCH_CONFIG.apiUrl)
        break
      }
      case 401: props.dispatch(setUserConnected({ logged: false })); break
      default: props.dispatch(setUserConnected({ logged: false })); break
    }
  }

  componentDidUpdate (prevProps) {
    this.handleHeadTitleAndFavicon(
      prevProps.system.titleArgs,
      prevProps.notificationPage.unreadNotificationCount,
      prevProps.notificationPage.unreadMentionCount
    )
  }

  componentWillUnmount () {
    this.liveMessageManager.closeLiveMessageConnection()
  }

  loadAppConfig = async () => {
    const { props } = this

    const fetchGetConfig = await props.dispatch(getConfig())
    if (fetchGetConfig.status === 200) {
      props.dispatch(setConfig(fetchGetConfig.json))
    }

    const fetchGetAppList = await props.dispatch(getAppList())
    // FIXME - GB - 2019-07-23 - Hack to add the share folder app at appList while he still doesn't exist in backend
    if (fetchGetAppList.status === 200) {
      fetchGetAppList.json.push(
        {
          hexcolor: '#414548',
          slug: 'contents/share_folder',
          config: {},
          fa_icon: 'share-alt',
          is_active: true,
          label: 'Share Folder'
        }
      )
      props.dispatch(setAppList(fetchGetAppList.json))
    }

    const fetchGetContentTypeList = await props.dispatch(getContentTypeList())
    if (fetchGetContentTypeList.status === 200) props.dispatch(setContentTypeList(fetchGetContentTypeList.json))
  }

  loadUserConfiguration = async userId => {
    const { props } = this

    const fetchGetUserConfig = await props.dispatch(getUserConfiguration(userId))
    switch (fetchGetUserConfig.status) {
      case 200: props.dispatch(setUserConfiguration(fetchGetUserConfig.json.parameters)); break
      default: props.dispatch(newFlashMessage(props.t('Error while loading the user configuration')))
    }
  }

  loadWorkspaceLists = async () => {
    const { props } = this

    const showOwnedWorkspace = false

    const fetchGetWorkspaceList = await props.dispatch(getMyselfWorkspaceList(showOwnedWorkspace))

    if (fetchGetWorkspaceList.status !== 200) return false

    props.dispatch(setWorkspaceList(fetchGetWorkspaceList.json))
    this.loadWorkspaceListMemberList(fetchGetWorkspaceList.json)
    this.setState({ workspaceListLoaded: true })

    const fetchAccessibleWorkspaceList = await props.dispatch(getAccessibleWorkspaces(props.user.userId))

    if (fetchAccessibleWorkspaceList.status !== 200) return false

    props.dispatch(setAccessibleWorkspaceList(fetchAccessibleWorkspaceList.json))

    return true
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

  handleHeadTitleAndFavicon = (prevHeadTitleArgs, prevUnreadNotificationCount, prevUnreadMentionCount) => {
    const { props } = this

    const hasHeadTitleChanged = !isEqual(prevHeadTitleArgs, props.system.titleArgs)
    const unreadMentionCount = props.notificationPage.unreadMentionCount
    const hasUnreadMentionCountChanged = unreadMentionCount !== prevUnreadMentionCount
    const unreadNotificationCount = props.notificationPage.unreadNotificationCount
    const hasUnreadNotificationCountChanged = unreadNotificationCount !== prevUnreadNotificationCount

    if ((hasHeadTitleChanged || hasUnreadMentionCountChanged) && props.system.titleArgs.length > 0) {
      let newHeadTitle = buildHeadTitle(props.system.titleArgs)
      if (unreadMentionCount > 0) {
        newHeadTitle = `(${unreadMentionCount > 99 ? '99+' : unreadMentionCount}) ${newHeadTitle}`
      }
      document.title = newHeadTitle
    }

    if (hasUnreadMentionCountChanged || hasUnreadNotificationCountChanged) {
      toggleFavicon(unreadNotificationCount > 0, unreadMentionCount > 0)
    }
  }

  handleRemoveFlashMessage = msg => this.props.dispatch(removeFlashMessage(msg))

  handleClickNotificationButton = () => {
    this.setState(prev => ({
      isNotificationWallOpen: !prev.isNotificationWallOpen
    }))
  }

  // INFO - MP - 2021-11-10 - Helper function
  // Return the current time HH:mm
  getHoursAndMinutes = () => {
    return formatAbsoluteDate(new Date(), this.props.user.lang, { hour: '2-digit', minute: '2-digit' })
  }

  render () {
    const { props, state } = this
    let callLink

    if (state.userCall) {
      const userCalleeName = state.userCall.callee.public_name
      const userCallUrl = state.userCall.url
      callLink = (
        <Trans>
          <span> {{ userCalleeName }} has accepted your call. If the call has not opened click on this
            <a href={userCallUrl} target='_blank' rel='noopener noreferrer'> link </a>
          </span>&nbsp;
        </Trans>
      )
    }

    if (props.user.logged === null) return null // @TODO show loader

    if (!props.location.pathname.includes('/ui')) return <Redirect to={PAGE.HOME} />

    if (
      !unLoggedAllowedPageList.some(url => props.location.pathname.startsWith(url)) && (
        !props.system.workspaceListLoaded ||
        !props.system.appListLoaded ||
        !props.system.contentTypeListLoaded
      )
    ) return null // @TODO Côme - 2018/08/22 - should show loader here

    return (
      <div className='tracim fullWidthFullHeight'>
        <Header
          onClickNotification={this.handleClickNotificationButton}
          unreadNotificationCount={props.notificationPage.unreadNotificationCount}
          unreadMentionCount={props.notificationPage.unreadMentionCount}
        />
        {state.displayConnectionError && (
          <FlashMessage
            className='connection_error'
            flashMessage={
              [{
                message: props.t('Tracim has a connection problem, please wait or restart your browser if the problem persists'),
                type: 'danger'
              }]
            }
            showCloseButton={false}
            t={props.t}
          />
        )}
        <FlashMessage
          flashMessage={props.flashMessage}
          onRemoveFlashMessage={this.handleRemoveFlashMessage}
          t={props.t}
        />

        {state.userCall && (state.userCall.callee.user_id === props.user.userId) && (
          <CardPopup
            customClass=''
            customHeaderClass='primaryColorBg'
            onClose={this.handleClickRejectCall}
            label={props.t('{{username}} is calling you', { username: state.userCall.caller.public_name })}
            faIcon='fas fa-phone'
          >
            <div className='callpopup__body'>

              <div className='callpopup__body__btn'>
                <IconButton
                  onClick={this.handleClickRejectCall}
                  text={props.t('Decline')}
                  icon='fas fa-phone-slash'
                />
                <IconButton
                  onClick={this.handleClickDeclineCall}
                  text={props.t('I\'ll answer later')}
                  icon='far fa-clock'
                />

                <a href={state.userCall.url} target='_blank' rel='noopener noreferrer'>
                  {/* FIXME - MB - 2022-01-05 - a LinkButton should be created with the same style that IconButton
                  see https://github.com/tracim/tracim/issues/5242 */}
                  <IconButton
                    intent='primary'
                    mode='light'
                    onClick={this.handleClickOpenCallWindowCallee}
                    text={props.t('Open call')}
                    icon='fas fa-phone'
                    color={GLOBAL_primaryColor} // eslint-disable-line camelcase
                    customClass='openCallButton'
                  />
                </a>
              </div>
            </div>
          </CardPopup>
        )}

        {/* INFO - MP - 2021-10-15: Call popup */}
        {state.userCall && (state.userCall.caller.user_id === props.user.userId) && state.userCall.state === USER_CALL_STATE.IN_PROGRESS && (
          <CardPopup
            customClass=''
            customHeaderClass='primaryColorBg'
            onClose={this.handleClickCancelButton}
            label={props.t('Call in progress...')}
            faIcon='fas fa-phone'
          >
            <div className='gallery__delete__file__popup__body'>
              <div className='callpopup__text'>
                {props.t('{{username}} has received your call. If accepted, the call will open automatically.', { username: state.userCall.callee.public_name })}
              </div>

              <div className='gallery__delete__file__popup__body__btn'>
                <IconButton
                  onClick={this.handleClickCancelButton}
                  text={props.t('Cancel the call')}
                  icon='fas fa-phone-slash'
                />
                <a href={state.userCall.url} target='_blank' rel='noopener noreferrer'>
                  {/* FIXME - MB - 2022-01-05 - a LinkButton should be created with the same style that IconButton
                  see https://github.com/tracim/tracim/issues/5242 */}
                  <IconButton
                    intent='primary'
                    mode='light'
                    text={props.t('Open call')}
                    icon='fas fa-phone'
                    color={GLOBAL_primaryColor} // eslint-disable-line camelcase
                    customClass='openCallButton'
                  />
                </a>
              </div>
            </div>
          </CardPopup>
        )}
        {/* INFO - MP - 2021-10-15: Declined popup */}
        {state.userCall && (state.userCall.caller.user_id === props.user.userId) && state.userCall.state === USER_CALL_STATE.REJECTED && (
          <CardPopup
            customClass='callpopup__body'
            customHeaderClass='primaryColorBg'
            onClose={this.handleClosePopup}
            label={props.t('Call declined by {{username}} at {{time}}', { username: state.userCall.callee.public_name, time: this.getHoursAndMinutes() })}
            faIcon='fas fa-phone-slash'
            displayCloseButton
          />
        )}
        {/* INFO - MP - 2021-10-15: Call back later popup */}
        {state.userCall && (state.userCall.caller.user_id === props.user.userId) && state.userCall.state === USER_CALL_STATE.DECLINED && (
          <CardPopup
            customClass='callpopup__body'
            customHeaderClass='primaryColorBg'
            onClose={this.handleClosePopup}
            label={props.t('{{username}} will call you back later', { username: state.userCall.callee.public_name })}
            faIcon='fas fa-phone-slash'
            displayCloseButton
          />
        )}
        {/* INFO - MP - 2021-10-15: Call failed popup */}
        {state.userCall && (state.userCall.caller.user_id === props.user.userId) && state.userCall.state === USER_CALL_STATE.UNANSWERED && (
          <CardPopup
            customClass='callpopup__body'
            customHeaderClass='primaryColorBg'
            onClose={this.handleClosePopup}
            label={props.t('Call failed at {{time}}', { time: this.getHoursAndMinutes() })}
            faIcon='fas fa-phone-slash'
            displayCloseButton
          >
            <div className='callpopup__text'>
              {props.t('The call with {{username}} failed', { username: state.userCall.callee.public_name })}
            </div>

            <div className='gallery__delete__file__popup__body__btn'>
              <IconButton
                intent='primary'
                mode='light'
                onClick={this.handleClickRetryButton}
                text={props.t('Try again')}
                icon='fas fa-phone'
                color={GLOBAL_primaryColor} // eslint-disable-line camelcase
              />
            </div>
          </CardPopup>
        )}
        {/* INFO - MB - 2021-10-26: Accepted popup */}
        {state.userCall && (state.userCall.caller.user_id === props.user.userId) && state.userCall.state === USER_CALL_STATE.ACCEPTED && (
          <CardPopup
            customClass='callpopup__body'
            customHeaderClass='primaryColorBg'
            onClose={this.handleClosePopup}
            label={callLink}
            faIcon='fas fa-phone'
            displayCloseButton
          />
        )}

        <ReduxTlmDispatcher />

        <div className='sidebarpagecontainer'>
          <Route render={() => <Sidebar />} />

          <Route
            render={() => (
              <NotificationWall
                onCloseNotificationWall={this.handleClickNotificationButton}
                isNotificationWallOpen={state.isNotificationWallOpen}
              />
            )}
          />

          <Route path={PAGE.LOGIN} component={Login} />

          <Route path={PAGE.RECENT_ACTIVITIES} component={PersonalRecentActivities} />

          <Route path={PAGE.FORGOT_PASSWORD} component={ForgotPassword} />

          <Route path={PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF} component={ForgotPasswordNoEmailNotif} />

          <Route path={PAGE.RESET_PASSWORD} component={ResetPassword} />

          <Route
            exact
            path={PAGE.HOME}
            component={() => {
              if (!props.workspaceList.length) {
                return <Home canCreateWorkspace={getUserProfile(props.user.profile).id >= PROFILE.manager.id} />
              }
              return <Redirect to={{ pathname: PAGE.RECENT_ACTIVITIES, state: { from: props.location } }} />
            }}
          />

          <Route
            path={PAGE.FAVORITES}
            render={() => (
              <div className='tracim__content fullWidthFullHeight'>
                <Favorites />
              </div>
            )}
          />

          <Route
            path='/ui/workspaces/:idws?'
            render={({ match }) => (
              <WorkspacePage workspaceId={match.params.idws} history={props.history}>
                <Route
                  exact
                  path={PAGE.WORKSPACE.ROOT}
                  render={() => <Redirect to={{ pathname: PAGE.HOME, state: { from: props.location } }} />}
                />

                <Route
                  exact
                  path={`${PAGE.WORKSPACE.ROOT}/:idws`}
                  render={props2 => // handle '/workspaces/:id' and add '/contents'
                    <Redirect to={{ pathname: PAGE.WORKSPACE.CONTENT_LIST(props2.match.params.idws), state: { from: props.location } }} />}
                />

                <Route
                  path={[
                    PAGE.WORKSPACE.CONTENT(':idws', ':type', ':idcts'),
                    PAGE.WORKSPACE.CONTENT_LIST(':idws'),
                    PAGE.WORKSPACE.SHARE_FOLDER(':idws')
                  ]}
                  render={() => (
                    <div className='tracim__content fullWidthFullHeight'>
                      <WorkspaceContent />
                    </div>
                  )}
                />

                <Route
                  path={[
                    PAGE.WORKSPACE.ADVANCED_DASHBOARD(':idws')
                  ]}
                  render={() => (
                    <OpenWorkspaceAdvanced />
                  )}
                />

                <Route
                  path={PAGE.WORKSPACE.DASHBOARD(':idws')}
                  render={() => (
                    <div className='tracim__content fullWidthFullHeight'>
                      <Dashboard />
                    </div>
                  )}
                />

                <Route
                  exact
                  path={PAGE.WORKSPACE.PUBLICATIONS(':idws')}
                  render={() => (
                    <div className='tracim__content fullWidthFullHeight'>
                      <Publications />
                    </div>
                  )}
                />

                <Route
                  path={PAGE.WORKSPACE.RECENT_ACTIVITIES(':idws')}
                  render={({ match }) => (
                    // NOTE - RJ - 2021-03-29 - This redirection is there to avoid breaking old links to recent activities
                    // We may want to remove this redirection in the future. We will need to fix the related Cypress tests
                    <Redirect to={PAGE.WORKSPACE.DASHBOARD(match.params.idws)} />
                  )}
                />

                <Route
                  path={PAGE.WORKSPACE.AGENDA(':idws')}
                  render={() => <AppFullscreenRouter />}
                />
              </WorkspacePage>
            )}
          />

          <Route path={PAGE.ACCOUNT} render={() => <Account />} />

          <Route
            exact
            path={PAGE.ADMIN.USER_EDIT(':userid')}
            render={() => <AdminAccount />}
          />

          <Route
            exact
            path={PAGE.ADMIN.USER_SPACE_LIST(':userid')}
            render={() => <AdminAccount openSpacesManagement />}
          />

          <Route
            exact
            path={PAGE.PUBLIC_PROFILE(':userid')}
            component={PublicProfile}
          />

          <Route
            exact
            path={[
              PAGE.ADMIN.USER,
              PAGE.ADMIN.WORKSPACE,
              PAGE.AGENDA,
              PAGE.WORKSPACE.CONTENT_EDITION(),
              PAGE.WORKSPACE.GALLERY()
            ]}
            render={() => <AppFullscreenRouter />}
          />

          <Route path='/wip/:cp' component={WIPcomponent} /> {/* for testing purpose only */}

          <Route
            path={PAGE.SEARCH_RESULT}
            component={props.system.config.search_engine === SEARCH_TYPE.ADVANCED
              ? AdvancedSearch
              : SimpleSearch}
          />

          <Route path={PAGE.GUEST_UPLOAD(':token')} component={GuestUpload} />
          <Route path={PAGE.GUEST_DOWNLOAD(':token')} component={GuestDownload} />
          <Route path={PAGE.JOIN_WORKSPACE} component={JoinWorkspace} />
          <Route path={PAGE.CONTENT(':idcts')} component={ContentRedirection} />
          <Route path={PAGE.WORKSPACE.PUBLICATION(':idws', ':idcts')} component={ContentRedirection} />

          {/* the 3 divs below must stay here so that they always exist in the DOM regardless of the route */}
          <div id='appFullscreenContainer' />
          <div id='appFeatureContainer' />
          <div id='popupCreateContentContainer' />
        </div>
        {state.tooManyUsers && (
          <div className='tracim__pageBlock'>
            <CardPopup displayCrossButton={false} customHeaderClass='bg-danger'>
              <div className='tracim__pageBlock__cardPopupContent'>
                <div className='tracim__pageBlock__cardPopupContent__message'>
                  {props.t('You have reached the authorised number of simultaneous users. Please contact your administrator.')}
                  <div
                    className='tracim__pageBlock__cardPopupContent__customMessage'
                    dangerouslySetInnerHTML={{ __html: props.system.config.limitation__maximum_online_users_message }}
                  />
                </div>
                <div className='tracim__pageBlock__cardPopupContent__buttons'>
                  <IconButton
                    icon='fas fa-sign-out-alt'
                    text={props.t('Log out')}
                    title={props.t('Log out')}
                    type='button'
                    intent='secondary'
                    mode='dark'
                    disabled={false}
                    onClick={this.handleClickLogout}
                    dataCy='tracim__pageBlock__logout'
                  />
                  &nbsp;
                  <IconButton
                    icon='fas fa-redo'
                    text={props.t('Retry')}
                    title={props.t('Retry')}
                    type='button'
                    intent='secondary'
                    mode='dark'
                    disabled={false}
                    onClick={() => window.location.reload()}
                    dataCy='tracim__pageBlock__retry'
                  />
                </div>
              </div>
            </CardPopup>
          </div>
        )}
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, appList, contentType, currentWorkspace, workspaceList, flashMessage, system, tlm, notificationPage }) => ({
  breadcrumbs, user, appList, contentType, currentWorkspace, workspaceList, flashMessage, system, tlm, notificationPage
})
export default withRouter(connect(mapStateToProps)(translate()(TracimComponent(Tracim))))
