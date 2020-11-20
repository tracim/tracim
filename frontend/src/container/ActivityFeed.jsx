import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { Link, withRouter } from 'react-router-dom'

import {
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  CONTENT_TYPE,
  IconButton,
  TracimComponent,
  NUMBER_RESULTS_BY_PAGE,
  SUBSCRIPTION_TYPE,
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  permissiveNumberEqual
} from 'tracim_frontend_lib'

import {
  mergeWithActivityList,
  addMessageToActivityList,
  sortActivityList
} from '../util/activity.js'
import {
  FETCH_CONFIG,
  PAGE
} from '../util/helper.js'
import {
  getNotificationList,
  getWorkspaceDetail
} from '../action-creator.async.js'
import {
  setWorkspaceActivityList,
  setWorkspaceActivityNextPage,
  setBreadcrumbs,
  setHeadTitle,
  newFlashMessage,
  setWorkspaceDetail
} from '../action-creator.sync.js'

import TabBar from '../component/TabBar/TabBar.jsx'
import ContentWithPreviewActivity from '../component/Activity/ContentWithPreviewActivity.jsx'
import ContentWithoutPreviewActivity from '../component/Activity/ContentWithoutPreviewActivity.jsx'
import MemberActivity from '../component/Activity/MemberActivity.jsx'

require('../css/ActivityFeed.styl')

const ACTIVITY_COUNT_PER_PAGE = NUMBER_RESULTS_BY_PAGE
const NOTIFICATION_COUNT_PER_REQUEST = ACTIVITY_COUNT_PER_PAGE
const ENTITY_TYPE_COMPONENT_CONSTRUCTOR = new Map([
  [TLM_ET.CONTENT, (activity) => {
    return activity.newestMessage.fields.content.content_type === CONTENT_TYPE.FOLDER
      ? <ContentWithoutPreviewActivity activity={activity} key={activity.id} />
      : <ContentWithPreviewActivity activity={activity} key={activity.id} />
  }],
  [TLM_ET.SHAREDSPACE_MEMBER, (activity) => <MemberActivity activity={activity} key={activity.id} />],
  [TLM_ET.SHAREDSPACE_SUBSCRIPTION, (activity) => <MemberActivity activity={activity} key={activity.id} />]
])
const DISPLAYED_SUBSCRIPTION_STATE_LIST = [SUBSCRIPTION_TYPE.rejected.slug]
const DISPLAYED_MEMBER_CORE_EVENT_TYPE_LIST = [TLM_CET.CREATED, TLM_CET.MODIFIED]

export class ActivityFeed extends React.Component {
  constructor (props) {
    super(props)
    props.registerGlobalLiveMessageHandler(this.updateActivityList)
  }

  componentDidMount () {
    this.loadWorkspaceDetail()
    this.loadActivities(ACTIVITY_COUNT_PER_PAGE, true)
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.workspaceId === this.props.workspaceId) return
    this.loadWorkspaceDetail()
    this.loadActivities(ACTIVITY_COUNT_PER_PAGE, true)
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  updateActivityList = async (data) => {
    const { props } = this
    if (!data.fields.workspace || !permissiveNumberEqual(data.fields.workspace.workspace_id, props.workspaceId)) return

    const updatedActivityList = await addMessageToActivityList(data, props.workspaceActivity.list, FETCH_CONFIG.apiUrl)
    props.dispatch(setWorkspaceActivityList(updatedActivityList))
  }

  handleRefreshClicked = () => {
    const { props } = this
    const updatedActivityList = sortActivityList(props.workspaceActivity.list)
    props.dispatch(setWorkspaceActivityList(updatedActivityList))
  }

  loadActivities = async (minActivityCount, resetList = false) => {
    const { props } = this
    let activityList = resetList ? [] : props.workspaceActivity.list
    let hasNextPage = resetList ? true : props.workspaceActivity.hasNextPage
    let nextPageToken = resetList ? '' : props.workspaceActivity.nextPageToken
    while (hasNextPage && activityList.length < minActivityCount) {
      const messageListResponse = await props.dispatch(getNotificationList(
        props.user.userId,
        {
          nextPageToken: nextPageToken,
          notificationsPerPage: NOTIFICATION_COUNT_PER_REQUEST,
          workspaceId: props.workspaceId,
          includeNotSent: true
        }
      ))
      activityList = await mergeWithActivityList(messageListResponse.json.items, activityList, FETCH_CONFIG.apiUrl)
      hasNextPage = messageListResponse.json.has_next
      nextPageToken = messageListResponse.json.next_page_token
    }

    props.dispatch(setWorkspaceActivityList(activityList))
    props.dispatch(setWorkspaceActivityNextPage(hasNextPage, nextPageToken))
  }

  loadWorkspaceDetail = async () => {
    const { props } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.workspaceId))
    switch (fetchWorkspaceDetail.status) {
      case 200:
        props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json))
        this.setHeadTitle()
        this.buildBreadcrumbs()
        break
      case 400:
        props.history.push(PAGE.HOME)
        props.dispatch(newFlashMessage(props.t('Unknown space')))
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('space detail')}`, 'warning')); break
    }
  }

  renderActivityComponent = (activity) => {
    const { props } = this
    const componentConstructor = ENTITY_TYPE_COMPONENT_CONSTRUCTOR.get(activity.entityType)
    const component = componentConstructor
      ? componentConstructor(activity)
      : <span>{props.t('Unknown activity type')}</span>
    return <div className='activity_feed__item' data-cy='activity_feed__item'>{component}</div>
  }

  isSubscriptionRequestOrRejection = (activity) => {
    return (activity.entityType === TLM_ET.SHAREDSPACE_SUBSCRIPTION &&
      DISPLAYED_SUBSCRIPTION_STATE_LIST.includes(activity.newestMessage.fields.subscription.state))
  }

  isMemberCreatedOrModified = (activity) => {
    const coreEventType = activity.newestMessage.event_type.split('.')[1]
    return (activity.entityType === TLM_ET.SHAREDSPACE_MEMBER &&
      DISPLAYED_MEMBER_CORE_EVENT_TYPE_LIST.includes(coreEventType))
  }

  activityDisplayFilter = (activity) => {
    return ENTITY_TYPE_COMPONENT_CONSTRUCTOR.has(activity.entityType) &&
      (
        activity.entityType === TLM_ET.CONTENT ||
        this.isSubscriptionRequestOrRejection(activity) ||
        this.isMemberCreatedOrModified(activity)
      )
  }

  buildBreadcrumbs = () => {
    const { props } = this

    const breadcrumbsList = [
      {
        link: <Link to={PAGE.HOME}><i className='fa fa-home' />{props.t('Home')}</Link>,
        type: BREADCRUMBS_TYPE.CORE
      },
      {
        link: (
          <Link to={PAGE.WORKSPACE.DASHBOARD(props.workspaceId)}>
            {props.currentWorkspace.label}
          </Link>
        ),
        type: BREADCRUMBS_TYPE.CORE
      },
      {
        link: (
          <Link to={PAGE.WORKSPACE.ACTIVITY_FEED(props.workspaceId)}>
            {props.t('Activity feed')}
          </Link>
        ),
        type: BREADCRUMBS_TYPE.CORE
      }
    ]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  setHeadTitle = () => {
    const { props } = this

    const headTitle = buildHeadTitle(
      [props.t('Activity feed'), props.currentWorkspace.label]
    )
    props.dispatch(setHeadTitle(headTitle))
  }

  render () {
    const { props } = this

    return (
      <div className='activity_feed'>
        <TabBar
          currentSpace={props.currentWorkspace}
          breadcrumbs={props.breadcrumbs}
        />
        <div className='activity_feed__content'>
          <IconButton
            customClass='activity_feed__refresh'
            text={props.t('Refresh')}
            intent='link'
            onClick={this.handleRefreshClicked}
            dataCy='activity_feed__refresh'
          />
          <div className='activity_feed__list' data-cy='activity_feed__list'>
            {props.workspaceActivity.list
              .filter(this.activityDisplayFilter)
              .map(this.renderActivityComponent) ||
             props.t('No activity here')}
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

const mapStateToProps = ({ lang, user, workspaceActivity, currentWorkspace, breadcrumbs }) => ({ lang, user, workspaceActivity, currentWorkspace, breadcrumbs })
export default connect(mapStateToProps)(withRouter(translate()(TracimComponent(ActivityFeed))))
