import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import {
  CONTENT_TYPE,
  IconButton,
  SUBSCRIPTION_TYPE,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET
} from 'tracim_frontend_lib'

import ContentWithPreviewActivity from './ContentWithPreviewActivity.jsx'
import ContentWithoutPreviewActivity from './ContentWithoutPreviewActivity.jsx'
import MemberActivity from './MemberActivity.jsx'

require('./ActivityList.styl')

const ENTITY_TYPE_COMPONENT_CONSTRUCTOR = new Map([
  [TLM_ET.CONTENT, (activity, onCopyLinkClicked) => {
    return activity.newestMessage.fields.content.content_type === CONTENT_TYPE.FOLDER
      ? <ContentWithoutPreviewActivity activity={activity} key={activity.id} />
      : <ContentWithPreviewActivity activity={activity} key={activity.id} onClickCopyLink={onCopyLinkClicked} />
  }],
  [TLM_ET.SHAREDSPACE_MEMBER, (activity) => <MemberActivity activity={activity} key={activity.id} />],
  [TLM_ET.SHAREDSPACE_SUBSCRIPTION, (activity) => <MemberActivity activity={activity} key={activity.id} />]
])
const DISPLAYED_SUBSCRIPTION_STATE_LIST = [SUBSCRIPTION_TYPE.rejected.slug]
const DISPLAYED_MEMBER_CORE_EVENT_TYPE_LIST = [TLM_CET.CREATED, TLM_CET.MODIFIED]

const ActivityList = (props) => {
  const renderActivityComponent = (activity) => {
    const componentConstructor = ENTITY_TYPE_COMPONENT_CONSTRUCTOR.get(activity.entityType)
    const component = componentConstructor
      ? componentConstructor(activity, () => props.onCopyLinkClicked(activity.newestMessage.fields.content))
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
      <IconButton
        customClass='activityList__refresh'
        text={props.t('Refresh')}
        intent='link'
        onClick={props.onRefreshClicked}
        dataCy='activityList__refresh'
      />
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
  onRefreshClicked: PropTypes.func.isRequired,
  onLoadMoreClicked: PropTypes.func.isRequired,
  onCopyLinkClicked: PropTypes.func.isRequired
}

export default translate()(ActivityList)
