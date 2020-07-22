import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import * as Cookies from 'js-cookie'
import i18n from '../util/i18n.js'
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
import Home from './Home.jsx'
import WIPcomponent from './WIPcomponent.jsx'
import { LiveMessageManager, LIVE_MESSAGE_STATUS } from '../util/LiveMessageManager.js'
import {
  CUSTOM_EVENT,
  PROFILE,
  serialize,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  PAGE,
  COOKIE_FRONTEND,
  unLoggedAllowedPageList,
  getUserProfile
} from '../util/helper.js'
import {
  getConfig,
  getAppList,
  getContentTypeList,
  getUserIsConnected,
  getMyselfWorkspaceList,
  putUserLang,
  getWorkspaceMemberList
} from '../action-creator.async.js'
import {
  newFlashMessage,
  removeFlashMessage,
  setConfig,
  setAppList,
  setContentTypeList,
  setUserConnected,
  setWorkspaceList,
  setBreadcrumbs,
  appendBreadcrumbs,
  setWorkspaceListMemberList,
  setLiveMessageManager,
  setLiveMessageManagerStatus
} from '../action-creator.sync.js'
import NotificationWall from './NotificationWall.jsx'
import SearchResult from './SearchResult.jsx'
import GuestUpload from './GuestUpload.jsx'
import GuestDownload from './GuestDownload.jsx'
import { serializeUserProps } from '../reducer/user.js'
import ReduxTlmDispatcher from './ReduxTlmDispatcher.jsx'

const CONNECTION_MESSAGE_DISPLAY_DELAY_MS = 4000

export class Tracim extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      firstTlmConnection: true,
      displayConnectionError: false,
      connectionErrorDisplayTimeoutId: -1
    }

    this.liveMessageManager = new LiveMessageManager()
    props.dispatch(setLiveMessageManager(this.liveMessageManager))

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.REDIRECT, handler: this.handleRedirect },
      { name: CUSTOM_EVENT.ADD_FLASH_MSG, handler: this.handleAddFlashMessage },
      { name: CUSTOM_EVENT.DISCONNECTED_FROM_API, handler: this.handleDisconnectedFromApi },
      { name: CUSTOM_EVENT.REFRESH_WORKSPACE_LIST_THEN_REDIRECT, handler: this.handleRefreshWorkspaceListThenRedirect },
      { name: CUSTOM_EVENT.SET_BREADCRUMBS, handler: this.handleSetBreadcrumbs },
      { name: CUSTOM_EVENT.APPEND_BREADCRUMBS, handler: this.handleAppendBreadcrumbs },
      { name: CUSTOM_EVENT.SET_HEAD_TITLE, handler: this.handleSetHeadTitle },
      { name: CUSTOM_EVENT.TRACIM_LIVE_MESSAGE_STATUS_CHANGED, handler: this.handleTlmStatusChanged }
    ])
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
    if (!document.location.pathname.includes('/login') && document.location.pathname !== '/ui') document.location.href = `${PAGE.LOGIN}?dc=1`
  }

  handleTlmStatusChanged = (data) => {
    console.log('%c<Tracim> Custom event', 'color: #28a745', CUSTOM_EVENT.TRACIM_LIVE_MESSAGE_STATUS_CHANGED, data)
    const { status } = data
    this.props.dispatch(setLiveMessageManagerStatus(status))
    if (status !== LIVE_MESSAGE_STATUS.OPENED && status !== LIVE_MESSAGE_STATUS.CLOSED) {
      if (this.state.connectionErrorDisplayTimeoutId === -1) {
        if (this.state.firstTlmConnection) this.displayConnectionError()
        else {
          const connectionErrorDisplayTimeoutId = globalThis.setTimeout(
            this.displayConnectionError,
            CONNECTION_MESSAGE_DISPLAY_DELAY_MS
          )
          this.setState({ connectionErrorDisplayTimeoutId })
        }
      }
    } else {
      globalThis.clearTimeout(this.state.connectionErrorDisplayTimeoutId)
      this.setState({ connectionErrorDisplayTimeoutId: -1, displayConnectionError: false, firstTlmConnection: false })
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

  handleSetHeadTitle = data => {
    console.log('%c<Tracim> Custom event', 'color: #28a745', CUSTOM_EVENT.SET_HEAD_TITLE, data)
    document.title = data.title
  }

  async componentDidMount () {
    // console.log('<Tracim> did Mount')
    const { props } = this

    const fetchGetUserIsConnected = await props.dispatch(getUserIsConnected())
    switch (fetchGetUserIsConnected.status) {
      case 200:
        if (fetchGetUserIsConnected.json.lang === null) this.setDefaultUserLang(fetchGetUserIsConnected.json)

        props.dispatch(setUserConnected({
          ...fetchGetUserIsConnected.json,
          logged: true
        }))

        Cookies.set(COOKIE_FRONTEND.LAST_CONNECTION, '1', { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
        Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, fetchGetUserIsConnected.json.lang, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })

        i18n.changeLanguage(fetchGetUserIsConnected.json.lang)

        this.loadAppConfig()
        this.loadWorkspaceList()

        this.liveMessageManager.openLiveMessageConnection(fetchGetUserIsConnected.json.user_id)

        break
      case 401: props.dispatch(setUserConnected({ logged: false })); break
      default: props.dispatch(setUserConnected({ logged: false })); break
    }
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

  loadWorkspaceList = async (openInSidebarId = undefined) => {
    const { props } = this

    const idWsToOpen = openInSidebarId || props.currentWorkspace.id || undefined
    const showOwnedWorkspace = false

    const fetchGetWorkspaceList = await props.dispatch(getMyselfWorkspaceList(showOwnedWorkspace))

    if (fetchGetWorkspaceList.status === 200) {
      const wsListWithOpenedStatus = fetchGetWorkspaceList.json.map(ws => ({ ...ws, isOpenInSidebar: ws.workspace_id === idWsToOpen }))

      props.dispatch(setWorkspaceList(wsListWithOpenedStatus))
      this.loadWorkspaceListMemberList(fetchGetWorkspaceList.json)
      this.setState({ workspaceListLoaded: true })

      return true
    }
    return false
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

  setDefaultUserLang = async loggedUser => {
    const { props } = this
    const fetchPutUserLang = await props.dispatch(putUserLang(serialize(loggedUser, serializeUserProps), props.user.lang))
    switch (fetchPutUserLang.status) {
      case 200: break
      default: props.dispatch(newFlashMessage(props.t('Error while saving your language')))
    }
  }

  handleRemoveFlashMessage = msg => this.props.dispatch(removeFlashMessage(msg))

  render () {
    const { props, state } = this

    if (props.user.logged === null) return null // @TODO show loader

    if (!props.location.pathname.includes('/ui')) return <Redirect to={PAGE.HOME} />

    // if (props.user.logged === false && !unLoggedAllowedPageList.includes(props.location.pathname)) {
    //   return <Redirect to={{pathname: PAGE.LOGIN, state: {from: props.location}}} />
    // }

    if (
      !unLoggedAllowedPageList.some(url => props.location.pathname.startsWith(url)) && (
        !props.system.workspaceListLoaded ||
        !props.system.appListLoaded ||
        !props.system.contentTypeListLoaded
      )
    ) return null // @TODO Côme - 2018/08/22 - should show loader here

    return (
      <div className='tracim fullWidthFullHeight'>
        <Header />
        {state.displayConnectionError && (
          <FlashMessage
            className='connection_error'
            flashMessage={
              [{
                message: props.t('Tracim has a connection problem, please wait or reload the page if the problem persists'),
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
        <ReduxTlmDispatcher />

        <div className='sidebarpagecontainer'>
          <Route render={() => <Sidebar />} />

          <Route render={() => <NotificationWall />} />

          <Route path={PAGE.LOGIN} component={Login} />

          <Route path={PAGE.FORGOT_PASSWORD} component={ForgotPassword} />

          <Route path={PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF} component={ForgotPasswordNoEmailNotif} />

          <Route path={PAGE.RESET_PASSWORD} component={ResetPassword} />

          <Route exact path={PAGE.HOME} component={() => <Home canCreateWorkspace={getUserProfile(props.user.profile).id >= PROFILE.manager.id} />} />

          <Route
            path='/ui/workspaces/:idws?'
            render={() =>
              <>
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
                  path={PAGE.WORKSPACE.DASHBOARD(':idws')}
                  render={() => (
                    <div className='tracim__content fullWidthFullHeight'>
                      <Dashboard />
                    </div>
                  )}
                />

                <Route
                  path={PAGE.WORKSPACE.AGENDA(':idws')}
                  render={() => <AppFullscreenRouter />}
                />
              </>}
          />

          <Route path={PAGE.ACCOUNT} render={() => <Account />} />

          <Route
            exact
            path={PAGE.ADMIN.USER_EDIT(':userid')}
            render={() => <AdminAccount />}
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

          <Route path={PAGE.SEARCH_RESULT} component={SearchResult} />

          <Route path={PAGE.GUEST_UPLOAD(':token')} component={GuestUpload} />
          <Route path={PAGE.GUEST_DOWNLOAD(':token')} component={GuestDownload} />

          {/* the 3 divs bellow must stay here so that they always exists in the DOM regardless of the route */}
          <div id='appFullscreenContainer' />
          <div id='appFeatureContainer' />
          <div id='popupCreateContentContainer' />
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, appList, contentType, currentWorkspace, workspaceList, flashMessage, system, tlm }) => ({
  breadcrumbs, user, appList, contentType, currentWorkspace, workspaceList, flashMessage, system, tlm
})
export default withRouter(connect(mapStateToProps)(translate()(TracimComponent(Tracim))))
