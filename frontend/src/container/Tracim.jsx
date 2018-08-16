import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import Login from './Login.jsx'
import Account from './Account.jsx'
import AppFullscreenRouter from './AppFullscreenRouter.jsx'
import FlashMessage from '../component/FlashMessage.jsx'
import WorkspaceContent from './WorkspaceContent.jsx'
import WIPcomponent from './WIPcomponent.jsx'
import {
  Route, withRouter, Redirect
} from 'react-router-dom'
import { COOKIE, PAGE } from '../helper.js'
import {
  getUserIsConnected
} from '../action-creator.async.js'
import {
  newFlashMessage,
  removeFlashMessage,
  setUserConnected
} from '../action-creator.sync.js'
import Cookies from 'js-cookie'
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
    }
  }

  async componentDidMount () {
    // console.log('<Tracim> did Mount')
    const { dispatch } = this.props

    const userFromCookies = {
      email: Cookies.get(COOKIE.USER_LOGIN),
      auth: Cookies.get(COOKIE.USER_AUTH)
    }

    const fetchGetUserIsConnected = await dispatch(getUserIsConnected(userFromCookies))
    switch (fetchGetUserIsConnected.status) {
      case 200:
        dispatch(setUserConnected({
          ...fetchGetUserIsConnected.json,
          auth: userFromCookies.auth,
          logged: true
        }))
        break
      case 401:
        dispatch(setUserConnected({logged: false})); break
      default:
        dispatch(setUserConnected({logged: null})); break
    }
  }

  handleRemoveFlashMessage = msg => this.props.dispatch(removeFlashMessage(msg))

  render () {
    const { props } = this

    if (props.user.logged === null) return null // @TODO show loader

    if (props.user.logged === false && props.location.pathname !== '/login') {
      return <Redirect to={{pathname: '/login', state: {from: props.location}}} />
    }

    return (
      <div className='tracim'>
        <Header />
        <FlashMessage flashMessage={props.flashMessage} removeFlashMessage={this.handleRemoveFlashMessage} t={props.t} />

        <div className='tracim__content'>
          <Route path={PAGE.LOGIN} component={Login} />

          <Route exact path='/' component={() => {
            switch (props.user.logged) {
              case true:
                return <Redirect to={{pathname: PAGE.WORKSPACE.ROOT, state: {from: props.location}}} />
              case false:
                return <Redirect to={{pathname: '/login', state: {from: props.location}}} />
              case null:
                return null
            }
          }} />

          <Route path='/workspaces/:idws?' render={() => // Workspace Router
            <div className='sidebarpagecontainer'>
              <Sidebar />

              <Route exact path={PAGE.WORKSPACE.ROOT} render={() => props.workspaceList.length === 0 // handle '/' and redirect to first workspace
                ? null // @FIXME this needs to be handled in case of new user that has no workspace
                : <Redirect to={{pathname: PAGE.WORKSPACE.DASHBOARD(props.workspaceList[0].id), state: {from: props.location}}} />
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
            <div className='sidebarpagecontainer'>
              <Sidebar />
              <Account />
            </div>
          } />

          <Route path={PAGE.ADMIN.ROOT} render={() =>
            <div className='sidebarpagecontainer'>
              <Sidebar />

              <AppFullscreenRouter />
            </div>
          } />

          <Route path={'/wip/:cp'} component={WIPcomponent} /> {/* for testing purpose only */}

          <div id='appFeatureContainer' />
          <div id='popupCreateContentContainer' />
        </div>

      </div>
    )
  }
}

const mapStateToProps = ({ user, appList, contentType, workspaceList, flashMessage }) => ({ user, appList, contentType, workspaceList, flashMessage })
export default withRouter(connect(mapStateToProps)(translate()(Tracim)))
