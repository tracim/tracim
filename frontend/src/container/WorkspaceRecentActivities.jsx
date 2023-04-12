import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_SUB,
  Loading,
  TracimComponent,
  getComment,
  getContent,
  handleFetchResult,
  permissiveNumberEqual
} from 'tracim_frontend_lib'
import { FETCH_CONFIG } from '../util/helper.js'
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
    this.lastSpaceLoaded = -1
  }

  componentDidMount () {
    this.props.loadActivities(ACTIVITY_COUNT_PER_PAGE, true, this.props.workspaceId)
  }

  componentWillUnmount () {
    this.props.cancelCurrentLoadActivities()
  }

  componentDidUpdate (prevProps) {
    if (this.props.system.workspaceListLoaded && this.lastSpaceLoaded !== this.props.workspaceId) {
      this.props.cancelCurrentLoadActivities()
      this.props.loadActivities(ACTIVITY_COUNT_PER_PAGE, true, this.props.workspaceId)
      this.lastSpaceLoaded = this.props.workspaceId
    }
  }

  /**
   * Function to handle TLM which will be triggered on every global TLM
   *
   * See also PersonalRecentActivities.handleTlm
   * @async
   * @param {TLM} data
   * @returns
   */
  handleTlm = async (data) => {
    const { props } = this
    let tlm = data
    if (!data.fields.workspace ||
      !permissiveNumberEqual(data.fields.workspace.workspace_id, props.workspaceId)) return
    if (data.event_type === `${TLM_ET.SHAREDSPACE_MEMBER}.${TLM_CET.MODIFIED}`) {
      const member = props.currentWorkspace.memberList.find(user => user.id === data.fields.user.user_id)
      if (!member || member.role === data.fields.member.role) return
    }
    if (data.event_type.includes(TLM_ET.MENTION) || data.event_type.includes(TLM_SUB.COMMENT)) {
      const comment = await handleFetchResult(
        await getComment(FETCH_CONFIG.apiUrl, data.fields.workspace.workspace_id, data.fields.content.parent_id, data.fields.content.content_id)
      )
      tlm = { ...data, fields: { ...data.fields, content: { ...data.fields.content, ...comment.body } } }
    } else if (data.event_type.includes(TLM_ET.CONTENT)) {
      const content = await handleFetchResult(
        await getContent(FETCH_CONFIG.apiUrl, data.fields.content.content_id)
      )
      tlm = { ...data, fields: { ...data.fields, content: { ...data.fields.content, ...content.body } } }
    }
    props.handleTlm(tlm)
  }

  handleClickLoadMore = async () => {
    const { props } = this

    if (this.isLoadMoreIsProgress) return

    this.isLoadMoreIsProgress = true
    await props.loadActivities(
      props.activity.list.length + ACTIVITY_COUNT_PER_PAGE, false, props.workspaceId
    )
    this.isLoadMoreIsProgress = false
  }

  render () {
    const { props } = this

    return (
      <div className='workspaceRecentActivities'>
        <div className='workspaceRecentActivities__header subTitle'>
          {props.t('Recent activities')}
        </div>

        {this.lastSpaceLoaded === this.props.workspaceId ? (
          <ActivityList
            activity={props.activity}
            onRefreshClicked={props.onRefreshClicked}
            onLoadMoreClicked={this.handleClickLoadMore}
            onCopyLinkClicked={props.onCopyLinkClicked}
            onEventClicked={props.onEventClicked}
            showRefresh={props.showRefresh}
            userId={props.user.userId}
            workspaceList={props.workspaceList}
          />
        ) : (
          <Loading
            height={100}
            text={props.t('Loading recent activities…')}
            width={100}
          />
        )}
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

const mapStateToProps = (
  { lang, user, workspaceActivity, currentWorkspace, breadcrumbs, system, workspaceList }
) => {
  return {
    lang, user, activity: workspaceActivity, currentWorkspace, breadcrumbs, system, workspaceList
  }
}
const component = withActivity(
  TracimComponent(WorkspaceRecentActivities),
  setWorkspaceActivityList,
  setWorkspaceActivityNextPage,
  resetWorkspaceActivity,
  setWorkspaceActivityEventList
)
export default connect(mapStateToProps)(translate()(component))
