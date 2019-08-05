import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Route, Redirect } from 'react-router-dom'
import { PAGE, PROFILE } from '../helper.js'
import appFactory from '../appFactory.js'
import { CUSTOM_EVENT } from 'tracim_frontend_lib'

class AppFullscreenRouter extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isMounted: false
    }
  }

  componentDidMount = () => this.setState({ isMounted: true })

  componentWillUnmount = () => {
    this.props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP)
  }

  render () {
    const { props } = this

    return (
      <div className='AppFullScreenManager'>

        {this.state.isMounted && (// we must wait for the component to be fully mounted to be sure the div#appFullscreenContainer exists in DOM
          <div className='emptyDivForRoute'>
            <Route exact path={PAGE.ADMIN.WORKSPACE} render={() => {
              if (props.user.profile !== PROFILE.ADMINISTRATOR.slug) return <Redirect to={{ pathname: '/ui' }} />

              const content = {
                workspaceList: [],
                userList: []
              }

              props.renderAppFullscreen({ slug: 'admin_workspace_user', hexcolor: '#7d4e24', type: 'workspace' }, props.user, content)
              return null
            }} />

            <Route exact path={PAGE.ADMIN.USER} render={() => {
              if (props.user.profile !== PROFILE.ADMINISTRATOR.slug) return <Redirect to={{ pathname: '/ui' }} />

              const content = {
                workspaceList: [],
                userList: []
              }

              props.renderAppFullscreen({ slug: 'admin_workspace_user', hexcolor: '#7d4e24', type: 'user' }, props.user, content)
              return null
            }} />

            <Route exact path={PAGE.AGENDA} render={() => {
              const agendaConfig = {
                workspaceId: null,
                forceShowSidebar: true
              }
              props.renderAppFullscreen({ slug: 'agenda', hexcolor: '#7d4e24', appConfig: agendaConfig }, props.user, {})
              return null
            }} />

            <Route path={PAGE.WORKSPACE.AGENDA(':idws')} render={() => {
              const agendaConfig = {
                workspaceId: props.match.params.idws,
                forceShowSidebar: false
              }
              props.renderAppFullscreen({ slug: 'agenda', hexcolor: '#7d4e24', appConfig: agendaConfig }, props.user, {})
              return null
            }} />

            <Route path={PAGE.WORKSPACE.CONTENT_EDITION(':idws', ':idcts')} render={({match}) => {
              props.renderAppFullscreen({ slug: 'office_document', hexcolor: '#7d4e24' }, props.user, {workspace_id: match.params.idws, content_id: match.params.idcts})
              return null
            }} />
          </div>
        )}
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default withRouter(connect(mapStateToProps)(appFactory(AppFullscreenRouter)))
