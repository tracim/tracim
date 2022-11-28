import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

import {
  getLoggedUserCalendar,
  getWorkspaceDetail
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceAgendaUrl,
  setWorkspaceDetail,
  setWorkspaceLoaded,
  setWorkspaceMemberList
} from '../action-creator.sync.js'
import { FETCH_CONFIG } from '../util/helper.js'
import {
  getSpaceMemberList,
  handleFetchResult,
  PAGE,
  Loading
} from 'tracim_frontend_lib'

class WorkspacePage extends React.Component {
  constructor (props) {
    super(props)
    this.updateCurrentWorkspace()
  }

  async updateCurrentWorkspace () {
    const { props } = this

    const requestMemberList = handleFetchResult(await getSpaceMemberList(FETCH_CONFIG.apiUrl, props.workspaceId))
    const requestWorkspaceDetail = props.dispatch(getWorkspaceDetail(props.workspaceId))

    const [responseMemberList, responseWorkspaceDetail] = await Promise.all([
      requestMemberList, requestWorkspaceDetail
    ])

    if (responseMemberList.apiResponse.status === 200 && responseWorkspaceDetail.status === 200) {
      props.dispatch(setWorkspaceMemberList(responseMemberList.body))
      props.dispatch(setWorkspaceDetail(responseWorkspaceDetail.json))
      props.dispatch(setWorkspaceLoaded())

      if (props.appList.some(a => a.slug === 'agenda') && responseWorkspaceDetail.json.agenda_enabled) {
        this.loadCalendarDetail()
      }
    } else {
      switch (responseMemberList.apiResponse.status) {
        case 200: break
        case 400: break
        default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('member list')}`, 'warning')); break
      }
      switch (responseWorkspaceDetail.status) {
        case 200: break
        case 400:
          props.history.push(PAGE.HOME)
          props.dispatch(newFlashMessage(props.t('Unknown space')))
          break
        default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('space detail')}`, 'warning')); break
      }
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

  componentDidUpdate (prevProps) {
    const { props } = this
    const newWorkspaceId = Number(props.workspaceId)
    const oldWorkspaceId = Number(prevProps.workspaceId)
    if (
      newWorkspaceId !== oldWorkspaceId ||
      prevProps.appList.length !== props.appList.length ||
      prevProps.contentType.length !== props.contentType.length
    ) {
      this.updateCurrentWorkspace()
    }
  }

  render = () => {
    const { props } = this
    return props.currentWorkspace.workspaceLoaded &&
      props.appList.length > 0 &&
      props.contentType.length > 0 &&
      Number(props.workspaceId) === Number(props.currentWorkspace.id)
      ? this.props.children
      : <div className='spacePage__loader'><Loading /></div>
  }
}

WorkspacePage.propTypes = {
  history: PropTypes.object.isRequired
}

const mapStateToProps = ({ appList, contentType, currentWorkspace }) => ({ appList, contentType, currentWorkspace })
export default connect(mapStateToProps)(translate()(WorkspacePage))
