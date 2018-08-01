import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Header from './Header.jsx'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import Account from './Account.jsx'
import AppFullscreenManager from './AppFullscreenManager.jsx'
import FlashMessage from '../component/FlashMessage.jsx'
import WorkspaceContent from './WorkspaceContent.jsx'
import WIPcomponent from './WIPcomponent.jsx'
import {
  Route, withRouter, Switch
} from 'react-router-dom'
import PrivateRoute from './PrivateRoute.jsx'
import { COOKIE, PAGE } from '../helper.js'
import {
  getAppList,
  getUserIsConnected
} from '../action-creator.async.js'
import {
  removeFlashMessage,
  setAppList,
  setUserConnected
} from '../action-creator.sync.js'
import Cookies from 'js-cookie'

class Tracim extends React.Component {
  async componentDidMount () {
    const { dispatch } = this.props

    const userFromCookies = {
      email: Cookies.get(COOKIE.USER_LOGIN),
      auth: Cookies.get(COOKIE.USER_AUTH)
    }

    const fetchGetUserIsConnected = await dispatch(getUserIsConnected(userFromCookies))
    switch (fetchGetUserIsConnected.status) {
      case 200:
        const userLogged = {
          ...fetchGetUserIsConnected.json,
          auth: userFromCookies.auth,
          logged: true
        }

        dispatch(setUserConnected(userLogged))

        const fetchGetAppList = await dispatch(getAppList(userLogged))
        if (fetchGetAppList.status === 200) dispatch(setAppList(fetchGetAppList.json))
        break

      case 401:
        dispatch(setUserConnected({logged: false})); break

      default:
        dispatch(setUserConnected({logged: null})); break
    }
  }

  handleRemoveFlashMessage = msg => this.props.dispatch(removeFlashMessage(msg))

  render () {
    const { flashMessage, t } = this.props

    return (
      <div className='tracim'>
        <Header />
        <FlashMessage flashMessage={flashMessage} removeFlashMessage={this.handleRemoveFlashMessage} t={t} />

        <div className='tracim__content'>
          <Route path={PAGE.LOGIN} component={Login} />

          <PrivateRoute exact path='/' component={WorkspaceContent} />

          <Switch>
            <PrivateRoute path={PAGE.WORKSPACE.DASHBOARD(':idws')} component={Dashboard} />
            <PrivateRoute path={PAGE.WORKSPACE.CALENDAR(':idws')} component={() => <div><br /><br /><br /><br />NYI</div>} />
            <PrivateRoute path={PAGE.WORKSPACE.CONTENT(':idws', ':type?', ':idcts?')} component={WorkspaceContent} />
          </Switch>

          <PrivateRoute path={PAGE.ACCOUNT} component={Account} />
          <PrivateRoute path={PAGE.ADMIN.ROOT} component={AppFullscreenManager} />
          <PrivateRoute path={'/wip/:cp'} component={WIPcomponent} /> {/* for testing purpose only */}

          <div id='appFeatureContainer' />
        </div>

      </div>
    )
  }
}

const mapStateToProps = ({ flashMessage }) => ({ flashMessage })
export default withRouter(connect(mapStateToProps)(translate()(Tracim)))
