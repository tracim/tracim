import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import * as Cookies from 'js-cookie'
import i18n from '../i18n.js'
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
import {
  Route, withRouter, Redirect
} from 'react-router-dom'
import {
  PAGE,
  unLoggedAllowedPageList,
  getUserProfile
} from '../helper.js'
import {
  getConfig,
  getAppList,
  getContentTypeList,
  getUserIsConnected,
  getMyselfWorkspaceList
} from '../action-creator.async.js'
import {
  newFlashMessage,
  removeFlashMessage,
  setConfig,
  setAppList,
  setContentTypeList,
  setUserConnected,
  setWorkspaceList
} from '../action-creator.sync.js'
import Dashboard from './Dashboard.jsx'
import Sidebar from './Sidebar.jsx'

class Tracim extends React.Component {
  constructor (props) {
    super(props)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    switch (type) {
      case 'redirect':
        console.log('%c<Tracim> Custom event', 'color: #28a745', type, data)
        this.props.history.push(data.url)
        break
      case 'addFlashMsg':
        console.log('%c<Tracim> Custom event', 'color: #28a745', type, data)
        this.props.dispatch(newFlashMessage(data.msg, data.type, data.delay))
        break
      case 'refreshWorkspaceList':
        console.log('%c<Tracim> Custom event', 'color: #28a745', type, data)
        this.loadWorkspaceList(data.idOpenInSidebar ? data.idOpenInSidebar : undefined)
        break
      case 'disconnectedFromApi':
        console.log('%c<Tracim> Custom event', 'color: #28a745', type, data)
        if (document.location.pathname !== '/login' && document.location.pathname !== '/') document.location.href = '/login?dc=1'
        break
      case 'refreshWorkspaceList_then_redirect': // Côme - 2018/09/28 - @fixme this is a hack to force the redirection AFTER the workspaceList is loaded
        await this.loadWorkspaceList()
        this.props.history.push(data.url)
        break
    }
  }

  async componentDidMount () {
    // console.log('<Tracim> did Mount')
    const { props } = this

    const fetchGetUserIsConnected = await props.dispatch(getUserIsConnected())
    switch (fetchGetUserIsConnected.status) {
      case 200:
        props.dispatch(setUserConnected({
          ...fetchGetUserIsConnected.json,
          logged: true
        }))
        Cookies.set('lastConnection', '1', {expires: 180})
        i18n.changeLanguage(fetchGetUserIsConnected.json.lang)
        this.loadAppConfig()
        this.loadWorkspaceList()
        break
      case 401: props.dispatch(setUserConnected({logged: false})); break
      default: props.dispatch(setUserConnected({logged: false})); break
    }
  }

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadAppConfig = async () => {
    const { props } = this

    const fetchGetConfig = await props.dispatch(getConfig())
    if (fetchGetConfig.status === 200) props.dispatch(setConfig(fetchGetConfig.json))

    const fetchGetAppList = await props.dispatch(getAppList())
    if (fetchGetAppList.status === 200) props.dispatch(setAppList(fetchGetAppList.json))

    const fetchGetContentTypeList = await props.dispatch(getContentTypeList())
    if (fetchGetContentTypeList.status === 200) props.dispatch(setContentTypeList(fetchGetContentTypeList.json))
  }

  loadWorkspaceList = async (idOpenInSidebar = undefined) => {
    const { props } = this

    const idWsToOpen = idOpenInSidebar || (props.workspaceList.find(ws => ws.isOpenInSidebar) || {id: undefined}).id

    const fetchGetWorkspaceList = await props.dispatch(getMyselfWorkspaceList())

    if (fetchGetWorkspaceList.status === 200) {
      const wsListWithOpenedStatus = fetchGetWorkspaceList.json.map(ws => ({...ws, isOpenInSidebar: ws.workspace_id === idWsToOpen}))

      props.dispatch(setWorkspaceList(wsListWithOpenedStatus))
      this.setState({workspaceListLoaded: true})

      return true
    }
    return false
  }

  handleRemoveFlashMessage = msg => this.props.dispatch(removeFlashMessage(msg))

  render () {
    const { props } = this

    if (props.user.logged === null) return null // @TODO show loader

    if (!props.location.pathname.includes('/ui')) return <Redirect to={PAGE.HOME} />

    // if (props.user.logged === false && !unLoggedAllowedPageList.includes(props.location.pathname)) {
    //   return <Redirect to={{pathname: PAGE.LOGIN, state: {from: props.location}}} />
    // }

    if (
      !unLoggedAllowedPageList.includes(props.location.pathname) && (
        !props.system.workspaceListLoaded ||
        !props.system.appListLoaded ||
        !props.system.contentTypeListLoaded
      )
    ) return null // @TODO Côme - 2018/08/22 - should show loader here

    return (
      <div className='tracim fullWidthFullHeight'>
        <Header />
        <FlashMessage flashMessage={props.flashMessage} removeFlashMessage={this.handleRemoveFlashMessage} t={props.t} />

        <div className='sidebarpagecontainer'>
          <Route render={() => <Sidebar />} />

          <Route path={PAGE.LOGIN} component={Login} />

          <Route path={PAGE.FORGOT_PASSWORD} component={ForgotPassword} />

          <Route path={PAGE.FORGOT_PASSWORD_NO_EMAIL_NOTIF} component={ForgotPasswordNoEmailNotif} />

          <Route path={PAGE.RESET_PASSWORD} component={ResetPassword} />

          <Route exact path={PAGE.HOME} component={() => <Home canCreateWorkspace={getUserProfile(props.user.profile).id <= 2} />} />

          <Route path='/ui/workspaces/:idws?' render={() => [// Workspace Router
            // @FIXME - CH - 2018-03-26 - the use of array in a render function avoid having to wrap everything into
            // a wrapper div.
            // This is required here to avoid having the div.tracim__content in the calendars pages.
            // To fix this, upgrade React to at least 16.2.0 and use the first class component React.Fragment instead
            // of the array syntax that is kind of misleading. Also remove the key props
            <Route exact path={PAGE.WORKSPACE.ROOT} key='workspace_root' render={() =>
              <Redirect to={{pathname: PAGE.HOME, state: {from: props.location}}} />
            } />,

            <Route exact path={`${PAGE.WORKSPACE.ROOT}/:idws`} key='workspace_redirect_to_contentlist' render={props2 => // handle '/workspaces/:id' and add '/contents'
              <Redirect to={{pathname: PAGE.WORKSPACE.CONTENT_LIST(props2.match.params.idws), state: {from: props.location}}} />
            } />,

            <Route
              path={[
                PAGE.WORKSPACE.CONTENT(':idws', ':type', ':idcts'),
                PAGE.WORKSPACE.CONTENT_LIST(':idws')
              ]}
              key='workspace_contentlist'
              render={() =>
                <div className='tracim__content fullWidthFullHeight'>
                  <WorkspaceContent />
                </div>
              }
            />,

            <Route path={PAGE.WORKSPACE.DASHBOARD(':idws')} key='workspace_dashboard' render={() =>
              <div className='tracim__content fullWidthFullHeight'>
                <Dashboard />
              </div>
            } />,

            <Route path={PAGE.WORKSPACE.CALENDAR(':idws')} key='workspace_calendar' render={() =>
              <AppFullscreenRouter />
            } />
          ]} />

          <Route path={PAGE.ACCOUNT} render={() => <Account />} />

          <Route exact path={PAGE.ADMIN.USER_EDIT(':iduser')} render={() => <AdminAccount />} />

          <Route exact path={[
            PAGE.ADMIN.USER,
            PAGE.ADMIN.WORKSPACE,
            PAGE.CALENDAR
          ]} render={() => <AppFullscreenRouter />} />

          <Route path={'/wip/:cp'} component={WIPcomponent} /> {/* for testing purpose only */}

          {/* the 3 divs bellow must stay here so that they always exists in the DOM regardless of the route */}
          <div
            id='appFullscreenContainer'
            className={
              classnames({'fullWidthFullHeight': [PAGE.ADMIN.WORKSPACE, PAGE.ADMIN.USER].includes(props.location.pathname)})
            }
          />
          <div id='appFeatureContainer' />
          <div id='popupCreateContentContainer' />
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, appList, contentType, workspaceList, flashMessage, system }) => ({ user, appList, contentType, workspaceList, flashMessage, system })
export default withRouter(connect(mapStateToProps)(translate()(Tracim)))
