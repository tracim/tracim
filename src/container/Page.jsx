import React from 'react'
import { connect } from 'react-redux'

class Page extends React.Component {
  render () {
    const { user } = this.props
    return (
      <div>
        Page ! user Logged in : {user.isLoggedIn.toString()}
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(Page)
