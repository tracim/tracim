import React from 'react'
import { connect } from 'react-redux'
import Footer from '../component/Footer.jsx'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import Login from './Login.jsx'
import Page from './Page.jsx'
import WorkspaceContent from './WorkspaceContent.jsx'
import {
  Route,
  withRouter
} from 'react-router-dom'
import PrivateRoute from './PrivateRoute.jsx'

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

class Tracim extends React.Component {
  render () {
    const { location } = this.props
    return (
      <div>
        <Header />

        <Route path='/login' component={Login} />

        <SidebarWrapper locationPath={location.pathname}>

          <PrivateRoute exact path='/' component={WorkspaceContent} />
          <PrivateRoute path='/page' component={Page} />

        </SidebarWrapper>

        <Footer />
      </div>
    )
  }
}

const mapStateToProps = () => ({})
export default withRouter(connect(mapStateToProps)(Tracim))
