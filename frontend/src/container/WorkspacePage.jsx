import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

import {
  getLoggedUserCalendar,
  getWorkspaceMemberList,
  getWorkspaceDetail
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceAgendaUrl,
  setWorkspaceDetail,
  setWorkspaceMemberList
} from '../action-creator.sync.js'

import { PAGE } from 'tracim_frontend_lib'

class WorkspacePage extends React.Component {
  constructor (props) {
    super(props)
    this.updateCurrentWorkspace()
  }

  async updateCurrentWorkspace () {
    await Promise.all([this.loadMemberList(), this.loadWorkspaceDetail()])
  }

  async loadMemberList () {
    const { props } = this

    const fetchWorkspaceMemberList = await props.dispatch(getWorkspaceMemberList(props.workspaceId))
    switch (fetchWorkspaceMemberList.status) {
      case 200: props.dispatch(setWorkspaceMemberList(fetchWorkspaceMemberList.json)); break
      case 400: break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('member list')}`, 'warning')); break
    }
  }

  async loadCalendarDetail () {
    const { props } = this

    const fetchCalendar = await props.dispatch(getLoggedUserCalendar())
    switch (fetchCalendar.status) {
      case 200: {
        const currentWorkspaceId = parseInt(props.workspaceId)
        const currentWorkspaceAgendaUrl = (fetchCalendar.json.find(a => a.workspace_id === currentWorkspaceId) || { agenda_url: '' }).agenda_url
        this.props.dispatch(setWorkspaceAgendaUrl(currentWorkspaceAgendaUrl))
        break
      }
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('agenda details')}`, 'warning')); break
    }
  }

  async loadWorkspaceDetail () {
    const { props } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.workspaceId))
    switch (fetchWorkspaceDetail.status) {
      case 200:
        props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json))
        if (props.appList.some(a => a.slug === 'agenda') && fetchWorkspaceDetail.json.agenda_enabled) {
          this.loadCalendarDetail()
        }
        break
      case 400:
        props.history.push(PAGE.HOME)
        props.dispatch(newFlashMessage(props.t('Unknown space')))
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('space detail')}`, 'warning')); break
    }
  }

  componentDidUpdate (prevProps) {
    const newWorkspaceId = Number(this.props.workspaceId)
    const oldWorkspaceId = Number(prevProps.workspaceId)
    if (newWorkspaceId !== oldWorkspaceId) {
      this.updateCurrentWorkspace()
    }
  }

  render = () => this.props.children
}

WorkspacePage.propTypes = {
  history: PropTypes.object.isRequired
}

const mapStateToProps = ({ appList }) => ({ appList })
export default connect(mapStateToProps)(translate()(WorkspacePage))
