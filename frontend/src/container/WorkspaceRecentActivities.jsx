import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  TracimComponent,
  permissiveNumberEqual
} from 'tracim_frontend_lib'

import {
  setWorkspaceActivityList,
  setWorkspaceActivityNextPage,
  resetWorkspaceActivity,
  setWorkspaceActivityEventList
} from '../action-creator.sync.js'

import ActivityList from '../component/Activity/ActivityList.jsx'
import { withActivity, ACTIVITY_COUNT_PER_PAGE } from './withActivity.jsx'

require('../css/RecentActivities.styl')

export class WorkspaceRecentActivities extends React.Component {
  constructor (props) {
    super(props)
    props.registerGlobalLiveMessageHandler(this.handleTlm)
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
    if (!data.fields.workspace ||
      !permissiveNumberEqual(data.fields.workspace.workspace_id, this.props.workspaceId)) return
    this.props.handleTlm(data)
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
          onLoadMoreClicked={() => {
            props.loadActivities(
              props.activity.list.length + ACTIVITY_COUNT_PER_PAGE,
              false,
              props.workspaceId
            )
          }}
          onCopyLinkClicked={props.onCopyLinkClicked}
          onEventClicked={props.onEventClicked}
          showRefresh={props.showRefresh}
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

const mapStateToProps = ({ lang, user, workspaceActivity, currentWorkspace, breadcrumbs }) => {
  return { lang, user, activity: workspaceActivity, currentWorkspace, breadcrumbs }
}
const component = withActivity(
  TracimComponent(WorkspaceRecentActivities),
  setWorkspaceActivityList,
  setWorkspaceActivityNextPage,
  resetWorkspaceActivity,
  setWorkspaceActivityEventList
)
export default connect(mapStateToProps)(translate()(component))
