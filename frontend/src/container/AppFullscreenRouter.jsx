import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Route, Redirect } from 'react-router-dom'
import { findUserRoleIdInWorkspace } from '../util/helper.js'
import appFactory from '../util/appFactory.js'
import {
  CUSTOM_EVENT,
  PAGE,
  PROFILE,
  ROLE_LIST
} from 'tracim_frontend_lib'

export class AppFullscreenRouter extends React.Component {
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
    const { props, state } = this

    const isDataReady = state.isMounted && props.workspaceList.length > 0 && props.workspaceList.every(ws => ws.memberList.length > 0)

    if (!state.isMounted || !props.user.logged) return null

    return (
      <div className='AppFullScreenManager'>
        <Route
          exact
          path={PAGE.ADMIN.WORKSPACE}
          render={() => {
            if (props.user.profile !== PROFILE.administrator.slug) return <Redirect to={{ pathname: '/ui' }} />

            const content = {
              workspaceList: [],
              userList: []
            }

            props.renderAppFullscreen({ slug: 'admin_workspace_user', hexcolor: '#7d4e24', type: 'workspace' }, props.user, null, content)
            return null
          }}
        />

        <Route
          exact
          path={PAGE.ADMIN.USER}
          render={() => {
            if (props.user.profile !== PROFILE.administrator.slug) return <Redirect to={{ pathname: '/ui' }} />

            const content = {
              workspaceList: [],
              userList: []
            }

            props.renderAppFullscreen({ slug: 'admin_workspace_user', hexcolor: '#7d4e24', type: 'user' }, props.user, null, content)
            return null
          }}
        />

        <Route
          exact
          path={PAGE.AGENDA}
          render={() => {
            const agendaConfig = {
              workspaceId: null,
              forceShowSidebar: true
            }
            props.renderAppFullscreen({ slug: 'agenda', hexcolor: '#7d4e24', appConfig: agendaConfig }, props.user, null, {})
            return null
          }}
        />

        {isDataReady && (
          <>
            <Route
              path={PAGE.WORKSPACE.AGENDA(':idws')}
              render={() => {
                const workspaceId = parseInt(props.match.params.idws)
                const agendaConfig = {
                  workspaceId: workspaceId,
                  forceShowSidebar: false
                }
                const workspaceMemberList = (props.workspaceList.find(ws => ws.id === workspaceId) || { memberList: [] }).memberList
                const userRoleIdInWorkspace = findUserRoleIdInWorkspace(props.user.userId, workspaceMemberList, ROLE_LIST)

                props.renderAppFullscreen({ slug: 'agenda', hexcolor: '#7d4e24', appConfig: agendaConfig }, props.user, userRoleIdInWorkspace, {})
                return null
              }}
            />

            <Route
              path={PAGE.WORKSPACE.GALLERY(':idws')}
              render={() => {
                const workspaceId = parseInt(props.match.params.idws)
                const galleryConfig = {
                  workspaceId: workspaceId,
                  forceShowSidebar: false
                }
                const workspaceMemberList = (props.workspaceList.find(ws => ws.id === workspaceId) || { memberList: [] }).memberList
                const userRoleIdInWorkspace = findUserRoleIdInWorkspace(props.user.userId, workspaceMemberList, ROLE_LIST)

                props.renderAppFullscreen({ slug: 'gallery', hexcolor: '#7d4e24', appConfig: galleryConfig }, props.user, userRoleIdInWorkspace, {})
                return null
              }}
            />

            <Route
              path={PAGE.WORKSPACE.CONTENT_EDITION(':idws', ':idcts')}
              render={({ match }) => {
                const workspaceId = parseInt(props.match.params.idws)
                const content = {
                  workspace_id: workspaceId,
                  content_id: match.params.idcts
                }
                const workspaceMemberList = (props.workspaceList.find(ws => ws.id === workspaceId) || { memberList: [] }).memberList
                const userRoleIdInWorkspace = findUserRoleIdInWorkspace(props.user.userId, workspaceMemberList, ROLE_LIST)

                props.renderAppFullscreen({ slug: 'collaborative_document_edition', hexcolor: '#7d4e24' }, props.user, userRoleIdInWorkspace, content)
                return null
              }}
            />
          </>
        )}
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList }) => ({ user, workspaceList })
export default withRouter(connect(mapStateToProps)(appFactory(AppFullscreenRouter)))
