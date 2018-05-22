import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Footer from '../component/Footer.jsx'
import Header from './Header.jsx'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import Account from './Account.jsx'
import FlashMessage from '../component/FlashMessage.jsx'
import WorkspaceContent from './WorkspaceContent.jsx'
import WIPcomponent from './WIPcomponent.jsx'
import {
  Route,
  withRouter
} from 'react-router-dom'
import PrivateRoute from './PrivateRoute.jsx'
import { PAGE } from '../helper.js'
import {
  getLangList,
  getUserIsConnected
} from '../action-creator.async.js'
import {
  removeFlashMessage,
  setUserConnected
} from '../action-creator.sync.js'

class Tracim extends React.Component {
  async componentDidMount () {
    const { dispatch } = this.props

    dispatch(getLangList())

    const fetchGetUserIsConnected = await dispatch(getUserIsConnected())
    switch (fetchGetUserIsConnected.status) {
      case 200:
        dispatch(setUserConnected({...fetchGetUserIsConnected.json, logged: true})); break
      case 401:
        dispatch(setUserConnected({logged: false})); break
      default:
        dispatch(setUserConnected({logged: undefined})); break
    }
  }

  handleRemoveFlashMessage = msg => this.props.dispatch(removeFlashMessage(msg))

  render () {
    const { flashMessage, user, t } = this.props

    return (
      <div className='tracim'>
        <Header />
        <FlashMessage flashMessage={flashMessage} removeFlashMessage={this.handleRemoveFlashMessage} t={t} />

        { user.logged === undefined
          ? (<div />) // while we dont know if user is connected, display nothing but the header @TODO show loader
          : (
            <div className='tracim__content'>
              <Route path={PAGE.LOGIN} component={Login} />

              <PrivateRoute exact path={PAGE.HOME} component={WorkspaceContent} />
              <PrivateRoute exact path={PAGE.WORKSPACE.CONTENT_LIST(':idws')} component={WorkspaceContent} /> {/* "exact" here to not double match Route WORKSPACE.CONTENT */}
              <PrivateRoute path={PAGE.WORKSPACE.CONTENT(':idws', ':idcts')} component={WorkspaceContent} />
              <PrivateRoute path={PAGE.ACCOUNT} component={Account} />
              <PrivateRoute path={PAGE.WORKSPACE.DASHBOARD(':idws')} component={Dashboard} />
              <PrivateRoute path={'/wip/:cp'} component={WIPcomponent} /> {/* for testing purpose only */}

              <Footer />
            </div>
          )
        }
      </div>
    )
  }
}

const mapStateToProps = ({ flashMessage, user }) => ({ flashMessage, user })
export default withRouter(connect(mapStateToProps)(translate()(Tracim)))
