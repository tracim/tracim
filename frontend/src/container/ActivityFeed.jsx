import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  TLM_ENTITY_TYPE as TLM_ET,
  CONTENT_TYPE,
  IconButton,
  TracimComponent,
  NUMBER_RESULTS_BY_PAGE
} from 'tracim_frontend_lib'

import {
  mergeWithActivityList,
  addMessageToActivityList,
  sortActivityList
} from '../util/activity.js'
import {
  FETCH_CONFIG
} from '../util/helper.js'
import {
  getNotificationList
} from '../action-creator.async'

import ContentWithPreviewActivity from '../component/Activity/ContentWithPreviewActivity.jsx'
import ContentWithoutPreviewActivity from '../component/Activity/ContentWithoutPreviewActivity.jsx'
import MemberActivity from '../component/Activity/MemberActivity.jsx'
import { setWorkspaceActivityList, setWorkspaceActivityNextPage } from '../action-creator.sync.js'

require('../css/ActivityFeed.styl')

const ACTIVITY_COUNT_PER_PAGE = NUMBER_RESULTS_BY_PAGE
const NOTIFICATION_COUNT_PER_REQUEST = ACTIVITY_COUNT_PER_PAGE

export class ActivityFeed extends React.Component {
  constructor (props) {
    super(props)
    props.registerGlobalLiveMessageHandler(this.updateActivityList.bind(this))
  }

  componentDidMount () {
    this.loadActivities(ACTIVITY_COUNT_PER_PAGE)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.workspaceId === this.props.workspaceId) return

    this.loadActivities(ACTIVITY_COUNT_PER_PAGE)
  }

  async updateActivityList (data) {
    const { props } = this
    const updatedActivityList = await addMessageToActivityList(data, props.workspaceActivity.list, FETCH_CONFIG.apiUrl)
    props.dispatch(setWorkspaceActivityList(updatedActivityList))
  }

  sortActivityList () {
    const { props } = this
    const updatedActivityList = sortActivityList(props.workspaceActivity.list)
    props.dispatch(setWorkspaceActivityList(updatedActivityList))
  }

  async loadActivities (minActivityCount) {
    const { props } = this
    let activityList = props.workspaceActivity.list
    let hasNextPage = props.workspaceActivity.hasNextPage
    let nextPageToken = props.workspaceActivity.nextPageToken
    while (hasNextPage && activityList.length < minActivityCount) {
      const messageListResponse = await props.dispatch(getNotificationList(
        props.user.userId,
        {
          nextPageToken: nextPageToken,
          notificationsPerPage: NOTIFICATION_COUNT_PER_REQUEST,
          workspaceId: props.workspaceId
        }
      ))
      activityList = await mergeWithActivityList(messageListResponse.json.items, activityList, FETCH_CONFIG.apiUrl)
      hasNextPage = messageListResponse.json.has_next
      nextPageToken = messageListResponse.json.next_page_token
    }

    props.dispatch(setWorkspaceActivityList(activityList))
    props.dispatch(setWorkspaceActivityNextPage(hasNextPage, nextPageToken))
  }

  renderActivityComponent (activity) {
    let component = <span>Unknown activity type!</span>
    switch (activity.entityType) {
      case TLM_ET.CONTENT:
        component = activity.newestMessage.fields.content.content_type === CONTENT_TYPE.FOLDER
          ? <ContentWithoutPreviewActivity activity={activity} key={activity.id} />
          : <ContentWithPreviewActivity activity={activity} key={activity.id} />
        break
      case TLM_ET.SHAREDSPACE_MEMBER:
        component = <MemberActivity activity={activity} key={activity.id} />
        break
    }
    return <div className='activity_feed__item' data-cy='activity_feed__item'>{component}</div>
  }

  render () {
    const { props } = this

    return (
      <div className='activity_feed'>
        <div className='activity_feed__content'>
          <IconButton
            customClass='activity_feed__refresh'
            text={props.t('Refresh')}
            intent='link'
            onClick={this.sortActivityList.bind(this)}
            dataCy='activity_feed__refresh'
          />
          <div className='activity_feed__list' data-cy='activity_feed__list'>
            {props.workspaceActivity.list.map(this.renderActivityComponent.bind(this)) || props.t('No activity here')}
          </div>
          {props.workspaceActivity.hasNextPage && (
            <IconButton
              text={props.t('See more')}
              icon='chevron-down'
              onClick={() => this.loadActivities(props.workspaceActivity.list.length + ACTIVITY_COUNT_PER_PAGE)}
              dataCy='activity_feed__more'
            />
          )}
        </div>
      </div>
    )
  }
}

ActivityFeed.propTypes = {
  workspaceId: PropTypes.string
}

const mapStateToProps = ({ lang, user, workspaceActivity, currentWorkspace }) => ({ lang, user, workspaceActivity, currentWorkspace })
export default connect(mapStateToProps)(translate()(TracimComponent(ActivityFeed)))
