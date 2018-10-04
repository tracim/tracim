import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import Login from './Login.jsx'
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
import { PAGE, getUserProfile } from '../helper.js'
import {
  getAppList,
  getContentTypeList,
  getUserIsConnected, getWorkspaceList
} from '../action-creator.async.js'
import {
  newFlashMessage,
  removeFlashMessage,
  setAppList,
  setContentTypeList,
  setUserConnected,
  setWorkspaceListIsOpenInSidebar,
  setWorkspaceList
} from '../action-creator.sync.js'
import Dashboard from './Dashboard.jsx'

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
    const { dispatch } = this.props

    const fetchGetUserIsConnected = await dispatch(getUserIsConnected())
    switch (fetchGetUserIsConnected.status) {
      case 200:
        dispatch(setUserConnected({
          ...fetchGetUserIsConnected.json,
          logged: true
        }))
        i18n.changeLanguage(fetchGetUserIsConnected.json.lang)
        this.loadAppConfig()
        this.loadWorkspaceList()
        break
      case 401:
        dispatch(setUserConnected({logged: false})); break
      default:
        dispatch(setUserConnected({logged: null})); break
    }
  }

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadAppConfig = async () => {
    const { props } = this

    const fetchGetAppList = await props.dispatch(getAppList())
    if (fetchGetAppList.status === 200) props.dispatch(setAppList(fetchGetAppList.json))

    const fetchGetContentTypeList = await props.dispatch(getContentTypeList())
    if (fetchGetContentTypeList.status === 200) props.dispatch(setContentTypeList(fetchGetContentTypeList.json))
  }

  loadWorkspaceList = async (idOpenInSidebar = undefined) => {
    const { props } = this

    const fetchGetWorkspaceList = await props.dispatch(getWorkspaceList(props.user))

    if (fetchGetWorkspaceList.status === 200) {
      this.setState({workspaceListLoaded: true})

      props.dispatch(setWorkspaceList(fetchGetWorkspaceList.json))

      idOpenInSidebar && props.dispatch(setWorkspaceListIsOpenInSidebar(idOpenInSidebar, true))

      return true
    }
    return false
  }

  handleRemoveFlashMessage = msg => this.props.dispatch(removeFlashMessage(msg))

  render () {
    const { props } = this

    if (props.user.logged === null) return null // @TODO show loader

    if (props.user.logged === false && props.location.pathname !== '/login') {
      return <Redirect to={{pathname: '/login', state: {from: props.location}}} />
    }

    if (props.location.pathname !== '/login' && (
      !props.system.workspaceListLoaded ||
      !props.system.appListLoaded ||
      !props.system.contentTypeListLoaded
    )) return null // @TODO Côme - 2018/08/22 - should show loader here

    return (
      <div className='tracim'>
        <Header />
        <FlashMessage flashMessage={props.flashMessage} removeFlashMessage={this.handleRemoveFlashMessage} t={props.t} />

        <div className='sidebarpagecontainer'>
          <Route
            // Côme - 2018/09/27 - path bellow is a little hacky. The point is to always match this route but still be
            // able to access props.match.params.idws
            // in <Sidebar>, I test :first and if it is equals to 'workspaces' then I know idws has the value I need
            path='/:first?/:idws?/*' render={() => <Sidebar />}
          />

          <div className='tracim__content'>
            <Route path={PAGE.LOGIN} component={Login} />

            <Route exact path={PAGE.HOME} component={() => {
              switch (props.user.logged) {
                case true: return <Home canCreateWorkspace={getUserProfile(props.user.profile).id <= 2} />
                case false: return <Redirect to={{pathname: PAGE.LOGIN, state: {from: props.location}}} />
                case null: return null
              }
            }} />

            <Route path='/workspaces/:idws?' render={() => // Workspace Router
              <div>
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

            <Route path={PAGE.ACCOUNT} render={() =>
              <Account />
            } />

            <Route exact path={PAGE.ADMIN.USER_EDIT(':iduser')} render={() =>
              <AdminAccount />
            } />

            <Route exact path={PAGE.ADMIN.USER} render={() => <AppFullscreenRouter />} />
            <Route exact path={PAGE.ADMIN.WORKSPACE} render={() => <AppFullscreenRouter />} />

            <Route path={'/wip/:cp'} component={WIPcomponent} /> {/* for testing purpose only */}

            {/* the 3 divs bellow must stay here so that they always exists in the DOM regardless of the route */}
            <div id='appFeatureContainer' />
            <div id='appFullscreenContainer' />
            <div id='popupCreateContentContainer' />
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, appList, contentType, workspaceList, flashMessage, system }) => ({ user, appList, contentType, workspaceList, flashMessage, system })
export default withRouter(connect(mapStateToProps)(translate()(Tracim)))
