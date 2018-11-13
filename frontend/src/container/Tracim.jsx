import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import * as Cookies from 'js-cookie'
import i18n from '../i18n.js'
import Header from './Header.jsx'
import Login from './Login.jsx'
import ForgotPassword from './ForgotPassword.jsx'
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
          <Route
            // Côme - 2018/09/27 - path bellow is a little hacky. The point is to always match this route but still be
            // able to access props.match.params.idws
            // in <Sidebar>, I test :first and if it is equals to 'workspaces' then I know idws has the value I need
            path='/ui(/:first?/:idws?/*)?' render={() => <Sidebar />}
            // @FIXME - Côme - 2018/11/02 - upgrade ReactRouter and refactor the route path='/ui' with array of string in this route path
          />

          <Route path={PAGE.LOGIN} component={Login} />

          <Route path={PAGE.FORGOT_PASSWORD} component={ForgotPassword} />

          <Route path={PAGE.RESET_PASSWORD} component={ResetPassword} />

          <Route exact path={PAGE.HOME} component={() => <Home canCreateWorkspace={getUserProfile(props.user.profile).id <= 2} />} />

          <Route path='/ui/workspaces/:idws?' render={() => // Workspace Router
            <div className='fullWidthFullHeight'>
              <Route exact path={PAGE.WORKSPACE.ROOT} render={() =>
                <Redirect to={{pathname: PAGE.HOME, state: {from: props.location}}} />
              } />

              <Route exact path={`${PAGE.WORKSPACE.ROOT}/:idws`} render={props2 => // handle '/workspaces/:id' and add '/contents'
                <Redirect to={{pathname: PAGE.WORKSPACE.CONTENT_LIST(props2.match.params.idws), state: {from: props.location}}} />
              } />

              <Route path={PAGE.WORKSPACE.DASHBOARD(':idws')} component={Dashboard} />
              <Route path={PAGE.WORKSPACE.CALENDAR(':idws')} component={() => <div><br /><br /><br /><br />NYI</div>} />
              <Route path={PAGE.WORKSPACE.CONTENT(':idws', ':type', ':idcts')} component={WorkspaceContent} />
              <Route exact path={PAGE.WORKSPACE.CONTENT_LIST(':idws')} component={WorkspaceContent} />
            </div>
          } />

          <Route path={PAGE.ACCOUNT} render={() => <Account />} />

          <Route exact path={PAGE.ADMIN.USER_EDIT(':iduser')} render={() => <AdminAccount />} />

          <Route exact path={PAGE.ADMIN.USER} render={() => <AppFullscreenRouter />} />

          <Route exact path={PAGE.ADMIN.WORKSPACE} render={() => <AppFullscreenRouter />} />

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
