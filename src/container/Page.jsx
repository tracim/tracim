import React from 'react'
import { connect } from 'react-redux'
import { Header } from '../component/Header.jsx'
import { Footer } from '../component/Footer.jsx'

class Page extends React.Component {
  render () {
    const { user } = this.props
    return (
      <div>
        <Header user={user} />
        <div>You are now connected, gg</div>
        <Footer />
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(Page)
