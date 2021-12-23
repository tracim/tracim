import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  TracimComponent,
  permissiveNumberEqual,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET
} from 'tracim_frontend_lib'

import {
  setWorkspaceActivityList,
  setWorkspaceActivityNextPage,
  resetWorkspaceActivity,
  setWorkspaceActivityEventList
} from '../action-creator.sync.js'

import ActivityList from '../component/Activity/ActivityList.jsx'
import { withActivity, ACTIVITY_COUNT_PER_PAGE } from './withActivity.jsx'

export class WorkspaceRecentActivities extends React.Component {
  constructor (props) {
    super(props)
    props.registerGlobalLiveMessageHandler(this.handleTlm)
    this.isLoadMoreIsProgress = false
  }

  componentDidMount () {
    this.props.loadActivities(ACTIVITY_COUNT_PER_PAGE, true, this.props.workspaceId)
  }

  componentWillUnmount () {
    this.props.cancelCurrentLoadActivities()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.workspaceId === this.props.workspaceId) return
    this.props.cancelCurrentLoadActivities()
    this.props.loadActivities(ACTIVITY_COUNT_PER_PAGE, true, this.props.workspaceId)
  }

  handleTlm = (data) => {
    const { props } = this
    if (!data.fields.workspace ||
      !permissiveNumberEqual(data.fields.workspace.workspace_id, props.workspaceId)) return
    if (data.event_type === `${TLM_ET.SHAREDSPACE_MEMBER}.${TLM_CET.MODIFIED}`) {
      const member = props.currentWorkspace.memberList.find(user => user.id === data.fields.user.user_id)
      if (!member || member.role === data.fields.member.role) return
    }

    props.handleTlm(data)
  }

  handleClickLoadMore = async () => {
    const { props } = this

    if (this.isLoadMoreIsProgress) return

    this.isLoadMoreIsProgress = true
    await props.loadActivities(props.activity.list.length + ACTIVITY_COUNT_PER_PAGE, false, props.workspaceId)
    this.isLoadMoreIsProgress = false
  }

  render () {
    const { props } = this

    return (
      <div className='workspaceRecentActivities'>
        <div className='workspaceRecentActivities__header subTitle'>
          {props.t('Recent activities')}
        </div>

        <ActivityList
          activity={props.activity}
          onRefreshClicked={props.onRefreshClicked}
          onLoadMoreClicked={this.handleClickLoadMore}
          onCopyLinkClicked={props.onCopyLinkClicked}
          onEventClicked={props.onEventClicked}
          showRefresh={props.showRefresh}
          workspaceList={props.workspaceList}
        />
      </div>
    )
  }
}

WorkspaceRecentActivities.propTypes = {
  loadActivities: PropTypes.func.isRequired,
  handleTlm: PropTypes.func.isRequired,
  onRefreshClicked: PropTypes.func.isRequired,
  onCopyLinkClicked: PropTypes.func.isRequired,
  workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
}

const mapStateToProps = ({ lang, user, workspaceActivity, currentWorkspace, breadcrumbs, workspaceList }) => {
  return { lang, user, activity: workspaceActivity, currentWorkspace, breadcrumbs, workspaceList }
}
const component = withActivity(
  TracimComponent(WorkspaceRecentActivities),
  setWorkspaceActivityList,
  setWorkspaceActivityNextPage,
  resetWorkspaceActivity,
  setWorkspaceActivityEventList
)
export default connect(mapStateToProps)(translate()(component))
