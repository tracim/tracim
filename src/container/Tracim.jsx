import React from 'react'
import { connect } from 'react-redux'
import Footer from '../component/Footer.jsx'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import AccountPage from './AccountPage.jsx'
import WorkspaceContent from './WorkspaceContent.jsx'
import {
  Route,
  withRouter
} from 'react-router-dom'
import PrivateRoute from './PrivateRoute.jsx'
import { getIsUserConnected } from '../action-creator.async.js'

class Tracim extends React.Component {
  componentDidMount = () => {
    this.props.dispatch(getIsUserConnected())
  }

  render () {
    const { user, location } = this.props

    const SidebarWrapper = props => {
      if (props.locationPath !== '/login') {
        return (
          <div className='sidebarpagecontainer'>
            <Sidebar />
            {props.children}
          </div>
        )
      } else return props.children
    }

    return (
      <div>
        <Header />

        { user.isLoggedIn === undefined
          ? (<div />) // while we dont know if user is connected, display nothing but the header @TODO show loader
          : (
            <div>
              <Route path='/login' component={Login} />

              <SidebarWrapper locationPath={location.pathname}>

                <PrivateRoute exact path='/' component={WorkspaceContent} />
                <PrivateRoute exact path='/account' component={AccountPage} />
                <PrivateRoute exact path='/dashboard' component={Dashboard} />

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
