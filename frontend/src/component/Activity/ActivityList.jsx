import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import {
  BREADCRUMBS_TYPE,
  CONTENT_TYPE,
  IconButton,
  PAGE,
  SUBSCRIPTION_TYPE,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET
} from 'tracim_frontend_lib'

import ContentWithPreviewActivity from './ContentWithPreviewActivity.jsx'
import ContentWithoutPreviewActivity from './ContentWithoutPreviewActivity.jsx'
import MemberActivity from './MemberActivity.jsx'

require('./ActivityList.styl')

const ENTITY_TYPE_COMPONENT_CONSTRUCTOR = new Map([
  [TLM_ET.CONTENT, (activity, breadcrumbsList, onCopyLinkClicked, onEventClicked) => {
    return activity.newestMessage.fields.content.content_type === CONTENT_TYPE.FOLDER
      ? (
        <ContentWithoutPreviewActivity
          activity={activity}
          key={activity.id}
          onClickCopyLink={onCopyLinkClicked}
          onEventClicked={onEventClicked}
          breadcrumbsList={breadcrumbsList}
        />
      )
      : (
        <ContentWithPreviewActivity
          activity={activity}
          key={activity.id}
          onClickCopyLink={onCopyLinkClicked}
          onEventClicked={onEventClicked}
          breadcrumbsList={breadcrumbsList}
        />
      )
  }],
  [TLM_ET.SHAREDSPACE_MEMBER, (activity) => <MemberActivity activity={activity} key={activity.id} />],
  [TLM_ET.SHAREDSPACE_SUBSCRIPTION, (activity) => <MemberActivity activity={activity} key={activity.id} />]
])
const DISPLAYED_SUBSCRIPTION_STATE_LIST = [SUBSCRIPTION_TYPE.rejected.slug]
const DISPLAYED_MEMBER_CORE_EVENT_TYPE_LIST = [TLM_CET.CREATED, TLM_CET.MODIFIED]

const ActivityList = (props) => {
  const buildActivityBreadcrumbsList = (activity) => {
    const workspace = activity.newestMessage.fields.workspace
    const dashboardBreadcrumb = {
      link: PAGE.WORKSPACE.DASHBOARD(workspace.workspace_id),
      type: BREADCRUMBS_TYPE.CORE,
      label: workspace.label,
      isALink: true
    }

    if (activity.contentPath.length > 0) {
      return [
        dashboardBreadcrumb,
        ...activity.contentPath.map(crumb => ({
          label: crumb.label,
          link: PAGE.WORKSPACE.CONTENT(workspace.workspace_id, crumb.content_type, crumb.content_id),
          type: BREADCRUMBS_TYPE.APP_FEATURE,
          isALink: true
        }))
      ]
    } else {
      // NOTE - S.G. - 2020-12-18 - Do not display a message to avoid
      // multiple errors if several breadcrumbs cannot be fetched
      return []
    }
  }

  const renderActivityComponent = (activity) => {
    const componentConstructor = ENTITY_TYPE_COMPONENT_CONSTRUCTOR.get(activity.entityType)
    const component = componentConstructor
      ? componentConstructor(
        activity,
        activity.entityType === TLM_ET.CONTENT ? buildActivityBreadcrumbsList(activity) : [],
        () => props.onCopyLinkClicked(activity.newestMessage.fields.content),
        () => props.onEventClicked(activity)
      )
      : <span>{props.t('Unknown activity type')}</span>
    return <div className='activityList__item' data-cy='activityList__item' key={component.key}>{component}</div>
  }

  const isSubscriptionRequestOrRejection = (activity) => {
    return (activity.entityType === TLM_ET.SHAREDSPACE_SUBSCRIPTION &&
      DISPLAYED_SUBSCRIPTION_STATE_LIST.includes(activity.newestMessage.fields.subscription.state))
  }

  const isMemberCreatedOrModified = (activity) => {
    const coreEventType = activity.newestMessage.event_type.split('.')[1]
    return (activity.entityType === TLM_ET.SHAREDSPACE_MEMBER &&
      DISPLAYED_MEMBER_CORE_EVENT_TYPE_LIST.includes(coreEventType))
  }

  const activityDisplayFilter = (activity) => {
    return ENTITY_TYPE_COMPONENT_CONSTRUCTOR.has(activity.entityType) &&
      (
        activity.entityType === TLM_ET.CONTENT ||
        isSubscriptionRequestOrRejection(activity) ||
        isMemberCreatedOrModified(activity)
      )
  }

  return (
    <div className='activityList'>
      {props.showRefresh && (
        <IconButton
          customClass='activityList__refresh'
          text={props.t('Refresh')}
          intent='link'
          onClick={props.onRefreshClicked}
          dataCy='activityList__refresh'
        />
      )}
      <div className='activityList__list' data-cy='activityList__list'>
        {props.activity.list.length > 0
          ? props.activity.list
            .filter(activityDisplayFilter)
            .map(renderActivityComponent)
          : <div className='activityList__placeholder'>{props.activity.hasNextPage ? props.t('Loading activity feed…') : props.t('No activity')}</div>}
      </div>
      {props.activity.list.length > 0 && props.activity.hasNextPage && (
        <IconButton
          text={props.t('See more')}
          icon='chevron-down'
          onClick={props.onLoadMoreClicked}
          dataCy='activityList__more'
        />
      )}
    </div>
  )
}

ActivityList.propTypes = {
  activity: PropTypes.object.isRequired,
  showRefresh: PropTypes.bool.isRequired,
  onRefreshClicked: PropTypes.func.isRequired,
  onLoadMoreClicked: PropTypes.func.isRequired,
  onCopyLinkClicked: PropTypes.func.isRequired,
  onEventClicked: PropTypes.func
}

export default translate()(ActivityList)
