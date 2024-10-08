import React from 'react'
import i18next from 'i18next'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
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
import CardPopupUsername from './CardPopupUsername'
import {
  CUSTOM_EVENT,
  LIVE_MESSAGE_ERROR_CODE,
  LIVE_MESSAGE_STATUS,
  PAGE,
  PROFILE,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  CardPopup,
  IconButton,
  LiveMessageManager,
  Loading,
  TracimComponent,
  buildHeadTitle,
  serialize
} from 'tracim_frontend_lib'
import {
  COOKIE_FRONTEND,
  FETCH_CONFIG,
  SEARCH_TYPE,
  WELCOME_ELEMENT_ID,
  getUserProfile,
  initializeCustomElements,
  toggleFavicon,
  unLoggedAllowedPageList
} from '../util/helper.js'
import {
  logoutUser,
  getAppList,
  getConfig,
  getContentTypeList,
  getMyselfWorkspaceConfigList,
  getUserConfiguration,
  getUserIsConnected,
  putUserLang,
  getUserMessagesSummary,
  getAccessibleWorkspaces,
  getMyselfAllKnownMember
} from '../action-creator.async.js'
import {
  newFlashMessage,
  removeFlashMessage,
  setConfig,
  setAppList,
  setContentTypeList,
  setUserConfiguration,
  setUserConnected,
  setUserWorkspaceConfigList,
  setBreadcrumbs,
  appendBreadcrumbs,
  setUnreadMentionCount,
  setUnreadNotificationCount,
  setHeadTitle,
  setAccessibleWorkspaceList,
  setKnownMemberList
} from '../action-creator.sync.js'
import HTMLMention from '../component/Mention/HTMLMention.js'
import Call from '../component/Call/Call.jsx'
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
import ToDo from './ToDo.jsx'

const CONNECTION_MESSAGE_DISPLAY_DELAY_MS = 4000

export class Tracim extends React.Component {
  constructor (props) {
    super(props)
    this.connectionErrorDisplayTimeoutId = 0
    this.state = {
      displayConnectionError: false,
      isNotificationWallOpen: false
    }

    initializeCustomElements('html-mention', HTMLMention)

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
  }

  handleSetHeadTitle = (data, titlePrefix = '') => {
    const { props } = this
    console.log('%c<Tracim> Custom event SETHEADTITLE', 'color: #28a745', CUSTOM_EVENT.SET_HEAD_TITLE, data)
    props.dispatch(setHeadTitle(data.title, titlePrefix))
  }

  handleClickLogout = async () => {
    await this.props.dispatch(logoutUser(this.props.history))
    this.setState({ tooManyUsers: false })

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('logout')
    }
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
    await this.loadWorkspaceList()
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
        this.loadWorkspaceList()
        this.loadKnownMemberList()
        this.loadNotificationNotRead(fetchUser.user_id)
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

  loadWorkspaceList = async () => {
    const { props } = this
    const fetchGetWorkspaceList = await props.dispatch(getMyselfWorkspaceConfigList())

    if (fetchGetWorkspaceList.status !== 200) return false
    props.dispatch(setUserWorkspaceConfigList(fetchGetWorkspaceList.json))

    const fetchAccessibleWorkspaceList = await props.dispatch(
      getAccessibleWorkspaces(props.user.userId)
    )

    if (fetchAccessibleWorkspaceList.status !== 200) return false

    props.dispatch(setAccessibleWorkspaceList(fetchAccessibleWorkspaceList.json))

    return true
  }

  loadKnownMemberList = async () => {
    const { props } = this
    try {
      const fetchGetKnownMemberList = await props.dispatch(getMyselfAllKnownMember())

      if (fetchGetKnownMemberList.status !== 200) return false

      props.dispatch(setKnownMemberList(fetchGetKnownMemberList.json))
    } catch (e) {
      console.error('Error in loadKnownMemberList', e)
      return false
    }
    return true
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

  setDefaultUserLang = async loggedUser => {
    const { props } = this
    const fetchPutUserLang = await props.dispatch(putUserLang(serialize(loggedUser, serializeUserProps), props.user.lang))
    switch (fetchPutUserLang.status) {
      case 200: break
      default: props.dispatch(newFlashMessage(props.t('Error while saving your language')))
    }
  }

  handleHeadTitleAndFavicon = (prevHeadTitleArgs, prevUnreadNotificationCount, prevUnreadMentionCount, prevUserConfig) => {
    const { props } = this

    const unreadNotificationCount = props.notificationPage.unreadNotificationCount
    const unreadMentionCount = props.notificationPage.unreadMentionCount

    const prevUserConfigHasChanged = !isEqual(prevUserConfig, props.user.config)
    const hasHeadTitleChanged = !isEqual(prevHeadTitleArgs, props.system.titleArgs)
    const hasUnreadMentionCountChanged = unreadMentionCount !== prevUnreadMentionCount || prevUserConfigHasChanged
    const hasUnreadNotificationCountChanged = unreadNotificationCount !== prevUnreadNotificationCount || prevUserConfigHasChanged

    if ((hasHeadTitleChanged || hasUnreadMentionCountChanged) && props.system.titleArgs?.length > 0) {
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

  render () {
    const { props, state } = this

    // INFO - MP - 2023-03-31 - Displaying a loader here make the loading page flicker
    if (props.user.logged === null) return null // @TODO show loader

    if (!props.location.pathname.includes('/ui')) return <Redirect to={PAGE.HOME} />

    if (
      !unLoggedAllowedPageList.some(url => props.location.pathname.startsWith(url)) && (
        !props.system.appListLoaded ||
        !props.system.contentTypeListLoaded
      )
    ) {
      return (
        <div className='tracim fullWidthFullHeight' dir={i18next.dir()}>
          <Loading
            height={48}
            width={48}
          />
        </div>
      )
    }

    return (
      <div className='tracim fullWidthFullHeight' dir={i18next.dir()}>
        <Header />

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

        <Call
          liveMessageManager={this.liveMessageManager}
        />

        {(!props.user.username &&
          props.user.logged &&
          Cookies.get(COOKIE_FRONTEND.SHOW_USERNAME_POPUP) === 'true' &&
          props.user.config.display_username_popup !== 'false'
        ) && (
          <CardPopupUsername />
        )}

        <ReduxTlmDispatcher />

        {/* INFO - CH - 2023-11-07 - notLoggedIn based on user.logged is used to reduce height because
        when not logged in, we display a 60px header. See Header.jsx */}
        <div className={classnames('sidebarpagecontainer', { notLoggedIn: props.user.logged === false })}>
          <Route
            render={() => (
              <Sidebar
                isNotificationWallOpen={state.isNotificationWallOpen}
                onClickNotification={this.handleClickNotificationButton}
                unreadMentionCount={props.notificationPage.unreadMentionCount}
                unreadNotificationCount={props.notificationPage.unreadNotificationCount}
                isSpaceListLoaded={props.system.workspaceListLoaded}
              />
            )}
          />

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
            path={PAGE.TODO}
            render={() => (
              <div className='tracim__content fullWidthFullHeight'>
                <ToDo />
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
