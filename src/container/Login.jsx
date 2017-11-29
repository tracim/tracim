import React from 'react'
import { connect } from 'react-redux'
import { ConnectionForm } from '../component/ConnectionForm.jsx'
import { userLogin } from '../action-creator.async.js'

class Login extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      inputLogin: '',
      inputPassword: ''
    }
  }

  handleChangeLogin = e => this.setState({inputLogin: e.target.value})
  handleChangePassword = e => this.setState({inputPassword: e.target.value})

  handleClickSubmit = () => this.props.dispatch(userLogin(this.state.inputLogin, this.state.inputPassword))

  render () {
    const { user } = this.props
    return (
      <div>
        <ConnectionForm
          user={user}
          onChangeLogin={this.handleChangeLogin}
          onChangePassword={this.handleChangePassword}
          onClickSubmit={this.handleClickSubmit}
        />
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(Login)
