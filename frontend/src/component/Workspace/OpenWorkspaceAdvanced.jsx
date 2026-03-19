import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import appFactory from '../../util/appFactory.js'
import { FETCH_CONFIG, findUserRoleIdInWorkspace } from '../../util/helper.js'
import { ROLE_LIST, CUSTOM_EVENT } from 'tracim_frontend_lib'
import { getLoggedUserCalendar } from '../../action-creator.async'
import { handleFetchResult } from 'tracim_frontend_lib/src/helper'
import { getSpaceUserRoleList } from 'tracim_frontend_lib/src/action.async'
import {
  setUserRoleList,
  setWorkspaceAgendaUrl,
  setWorkspaceLoaded
} from '../../action-creator.sync'

export class OpenWorkspaceAdvanced extends React.Component {
  openWorkspaceAdvanced = async (prevProps = {}) => {
    const { props } = this

    if (
      !props.match || isNaN(props.match.params.idws) ||
      (prevProps.match && props.match.params.idws === prevProps.match.params.idws)
    ) return

    await this.updateWorkspaceData()

    if (props.user && props.currentWorkspace && typeof props.currentWorkspace.agendaUrl === 'string') {
      console.debug('OpenWorkspaceAdvanced before renderApp', props.currentWorkspace.agendaUrl)
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

  /**
   * INFO - PG - 2026-03-18
   * Since #6834 we can call this screen directly from the sidebar space contextual menu
   * In consequence, we need to refresh some data (id and label are already ok)
   */
  async updateWorkspaceData () {
    const { props } = this
    const currentWorkspaceId = parseInt(props.currentWorkspace.id)

    const requestUserRoleList = await handleFetchResult(await getSpaceUserRoleList(FETCH_CONFIG.apiUrl, currentWorkspaceId))
    const fetchCalendar = await props.dispatch(getLoggedUserCalendar())

    const [responseUserRoleList] = await Promise.all([
      requestUserRoleList
    ])

    console.debug('OpenWorkspaceAdvanced before update', responseUserRoleList, fetchCalendar)

    if (responseUserRoleList.apiResponse.status === 200) {
      props.dispatch(setUserRoleList(responseUserRoleList.body))
    }
    if (fetchCalendar.status === 200) {
      const currentWorkspaceAgendaUrl = (fetchCalendar.json.find(a => a.workspace_id === currentWorkspaceId) || { agenda_url: '' }).agenda_url
      this.props.dispatch(setWorkspaceAgendaUrl(currentWorkspaceAgendaUrl))
      console.debug('OpenWorkspaceAdvanced after update calendar', currentWorkspaceAgendaUrl)
    }
    props.dispatch(setWorkspaceLoaded())
  }

  componentDidMount () {
    console.log('%c<OpenWorkspaceAdvanced> did Mount', 'color: #dcae84', this.props)
    this.openWorkspaceAdvanced()
  }

  componentDidUpdate (prevProps) {
    console.log('%c<OpenWorkspaceAdvanced> did Update', 'color: #dcae84', this.props)
    this.openWorkspaceAdvanced(prevProps)
  }

  componentWillUnmount () {
    this.props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP)
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
