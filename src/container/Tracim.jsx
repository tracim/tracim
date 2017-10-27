import React from 'react'
import { connect } from 'react-redux'
import Login from './Login.jsx'
import Page from './Page.jsx'
import {
  BrowserRouter,
  Route
} from 'react-router-dom'

class Tracim extends React.Component {
  render () {
    return (
      <BrowserRouter>
        <div>
          <Route path='/' render={() =>
            this.props.user.isLogedIn
              ? <Page />
              : <Login />
          } />
        </div>
      </BrowserRouter>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(Tracim)
