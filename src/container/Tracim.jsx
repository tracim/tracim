import React from 'react'
import { connect } from 'react-redux'
import Footer from '../component/Footer.jsx'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import Login from './Login.jsx'
import Page from './Page.jsx'
import Workspace from './Workspace.jsx'
import {
  Route,
  withRouter
} from 'react-router-dom'
import PrivateRoute from './PrivateRoute.jsx'

class Tracim extends React.Component {
  render () {
    const { location } = this.props
    return (
      <div>
        <Header />

        <Route path='/login' component={Login} />

        { location.pathname !== '/login' && // cant find "except" in <Route path />
          <Sidebar />
        }
        <Route exact path='/' component={Workspace} />
        <PrivateRoute path='/page' component={Page} />

        <Footer />
      </div>
    )
  }
}

const mapStateToProps = () => ({})
export default withRouter(connect(mapStateToProps)(Tracim))
