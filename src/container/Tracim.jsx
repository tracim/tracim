import React from 'react'
import { connect } from 'react-redux'
import Footer from '../component/Footer.jsx'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import AccountPage from './AccountPage.jsx'
import FlashMessage from './FlashMessage.jsx'
import WorkspaceContent from './WorkspaceContent.jsx'
import {
  Route,
  withRouter
} from 'react-router-dom'
import PrivateRoute from './PrivateRoute.jsx'
import { PAGE_NAME } from '../helper.js'
import { getIsUserConnected } from '../action-creator.async.js'

class Tracim extends React.Component {
  componentDidMount = () => {
    this.props.dispatch(getIsUserConnected())
  }

  render () {
    const { user, location } = this.props

    const SidebarWrapper = props => props.locationPath !== '/login'
      ? (
        <div className='sidebarpagecontainer'>
          <Sidebar />
          {props.children}
        </div>
      )
      : props.children

    return (
      <div>
        <Header />

        { user.isLoggedIn === undefined
          ? (<div />) // while we dont know if user is connected, display nothing but the header @TODO show loader
          : (
            <div>
              <Route path={PAGE_NAME.LOGIN} component={Login} />

              <SidebarWrapper locationPath={location.pathname}>

                <PrivateRoute exact path={PAGE_NAME.HOME} component={WorkspaceContent} />
                <PrivateRoute exact path={PAGE_NAME.ACCOUNT} component={AccountPage} />
                <PrivateRoute exact path={PAGE_NAME.DASHBOARD} component={Dashboard} />

              </SidebarWrapper>

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
