import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import appFactory from '../../util/appFactory.js'
import { findUserRoleIdInWorkspace } from '../../util/helper.js'
import { ROLE_LIST } from 'tracim_frontend_lib'

export class OpenWorkspaceAdvanced extends React.Component {
  openWorkspaceAdvanced = async (prevProps = {}) => {
    const { props } = this

    if (
      !props.match || isNaN(props.match.params.idws) ||
      (prevProps.match && props.match.params.idws === prevProps.match.params.idws)
    ) return

    if (props.user && props.currentWorkspace) {
      props.renderAppFeature(
        {
          label: 'Advanced dashboard',
          slug: 'workspace_advanced',
          faIcon: 'fas fa-users',
          hexcolor: GLOBAL_primaryColor,
          creationLabel: ''
        },
        props.user,
        findUserRoleIdInWorkspace(props.user.userId, props.currentWorkspace.memberList, ROLE_LIST),
        { ...props.currentWorkspace, workspace_id: props.currentWorkspace.id }
      )
    }
  }

  componentDidMount () {
    console.log('%c<OpenContentApp> did Mount', 'color: #dcae84', this.props)
    this.openWorkspaceAdvanced()
  }

  componentDidUpdate (prevProps) {
    console.log('%c<OpenContentApp> did Update', 'color: #dcae84', this.props)
    this.openWorkspaceAdvanced(prevProps)
  }

  render () {
    return null
  }
}

const mapStateToProps = ({ user, currentWorkspace }) => ({
  user,
  currentWorkspace
})
export default withRouter(connect(mapStateToProps)((appFactory(OpenWorkspaceAdvanced))))
