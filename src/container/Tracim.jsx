import React from 'react'
import { connect } from 'react-redux'
import Footer from '../component/Footer.jsx'
import Header from './Header.jsx'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import Account from './Account.jsx'
// import FlashMessage from './FlashMessage.jsx'
import WorkspaceContent from './WorkspaceContent.jsx'
import {
  Route,
  withRouter
} from 'react-router-dom'
import PrivateRoute from './PrivateRoute.jsx'
import { PAGE_NAME } from '../helper.js'
import {
  getLangList,
  getUserIsConnected
} from '../action-creator.async.js'

class Tracim extends React.Component {
  componentDidMount () {
    this.props.dispatch(getUserIsConnected())
    this.props.dispatch(getLangList())
  }

  render () {
    const { user } = this.props

    return (
      <div className='tracim'>
        <Header />

        { user.isLoggedIn === undefined
          ? (<div />) // while we dont know if user is connected, display nothing but the header @TODO show loader
          : (
            <div className='tracim__content'>
              <Route path={PAGE_NAME.LOGIN} component={Login} />

              <PrivateRoute exact path={PAGE_NAME.HOME} component={WorkspaceContent} />
              <PrivateRoute path={`${PAGE_NAME.WS_CONTENT}/:idws/:filter?`} component={WorkspaceContent} />
              <PrivateRoute exact path={PAGE_NAME.ACCOUNT} component={Account} />
              <PrivateRoute exact path={PAGE_NAME.DASHBOARD} component={Dashboard} />

              <Footer />
            </div>
          )
        }
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default withRouter(connect(mapStateToProps)(Tracim))
