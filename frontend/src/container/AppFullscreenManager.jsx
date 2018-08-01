import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Route } from 'react-router-dom'
import { PAGE } from '../helper.js'
import appFactory from '../appFactory.js'
import Sidebar from './Sidebar.jsx'

class AppFullscreenManager extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      AmIMounted: false
    }
  }

  componentDidMount = () => this.setState({AmIMounted: true})

  render () {
    const { user, renderAppFullscreen } = this.props

    return (
      <div className='sidebarpagecontainer'>
        <Sidebar />

        <div id='appFullscreenContainer' />

        {this.state.AmIMounted && (// we must wait for the component to be fully mounted to be sure the div#appFullscreenContainer exists in DOM
          <div className='emptyDiForRoute'>
            <Route path={PAGE.ADMIN.WORKSPACE} render={() => {
              renderAppFullscreen({slug: 'admin_workspace_user', hexcolor: '#7d4e24', type: 'workspace'}, user, {})
              return null
            }} />

            <Route path={PAGE.ADMIN.USER} render={() => {
              renderAppFullscreen({slug: 'admin_workspace_user', hexcolor: '#7d4e24', type: 'user'}, user, {})
              return null
            }} />
          </div>
        )}
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(withRouter(appFactory(AppFullscreenManager)))
