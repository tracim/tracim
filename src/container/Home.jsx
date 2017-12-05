import React from 'react'
import { connect } from 'react-redux'

class Home extends React.Component {
  render () {
    const { user } = this.props
    return (
      <div>
        Home.<br />
        User logged in : {user.isLoggedIn.toString()}
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(Home)
