import React from 'react'
import { connect } from 'react-redux'
import HeaderTpl from '../component/HeaderTpl.jsx'
import { updateUserLang } from '../action-creator.async.js'

class Header extends React.Component {
  handleChangeLang = newLang => this.props.dispatch(updateUserLang(newLang))
  handleSubmitSearch = search => console.log('search submited : ', search)

  render () {
    return (
      <HeaderTpl
        user={this.props.user}
        onChangeLang={this.handleChangeLang}
        onSubmitSearch={this.handleSubmitSearch}
      />
    )
  }
}
export default connect(({ user }) => ({ user }))(Header)
