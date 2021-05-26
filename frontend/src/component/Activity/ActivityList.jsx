import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { CONTENT_NAMESPACE } from '../../util/helper.js'
import {
  BREADCRUMBS_TYPE,
  CONTENT_TYPE,
  IconButton,
  PAGE,
  serialize,
  SUBSCRIPTION_TYPE,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET
} from 'tracim_frontend_lib'
import { serializeContentProps } from '../../reducer/workspaceContentList.js'
import FeedItemWithPreview from '../../container/FeedItemWithPreview.jsx'
import ContentWithoutPreviewActivity from './ContentWithoutPreviewActivity.jsx'
import MemberActivity from './MemberActivity.jsx'

require('./ActivityList.styl')

const ENTITY_TYPE_COMPONENT_CONSTRUCTOR = new Map([
  [TLM_ET.CONTENT, (activity, breadcrumbsList, onCopyLinkClicked, onEventClicked) => {
    const [entityType, coreEventType, subEntityType] = activity.newestMessage.event_type.split('.')
    const isPublication = activity.content.content_namespace === CONTENT_NAMESPACE.PUBLICATION
    const openInAppLink = PAGE.WORKSPACE.CONTENT(activity.content.workspace_id, activity.content.content_type, activity.content.content_id)
    const openAsPublicationLink = PAGE.WORKSPACE.PUBLICATION(activity.content.workspace_id, activity.content.content_id)
    const titleLink = isPublication
      ? openAsPublicationLink
      : openInAppLink
    const previewLink = isPublication
      ? openAsPublicationLink
      : openInAppLink
    return activity.content.content_type === CONTENT_TYPE.FOLDER
      ? (
        <ContentWithoutPreviewActivity
          activity={activity}
          isPublication={isPublication}
          key={activity.id}
          onClickCopyLink={onCopyLinkClicked}
          onEventClicked={onEventClicked}
          breadcrumbsList={breadcrumbsList}
          lastModificationType={coreEventType}
          lastModificationEntityType={entityType}
          lastModificationSubEntityType={subEntityType}
          content={serialize(activity.content, serializeContentProps)}
        />
      )
      : (
        <FeedItemWithPreview
          breadcrumbsList={breadcrumbsList}
          contentAvailable={activity.contentAvailable}
          commentList={activity.commentList}
          content={serialize(activity.content, serializeContentProps)}
          eventList={activity.eventList}
          isPublication={isPublication}
          inRecentActivities
          key={activity.id}
          lastModifier={activity.newestMessage.fields.author}
          lastModificationType={coreEventType}
          lastModificationEntityType={entityType}
          lastModificationSubEntityType={subEntityType}
          modifiedDate={activity.newestMessage.created}
          onClickCopyLink={onCopyLinkClicked}
          onEventClicked={onEventClicked}
          workspaceId={activity.newestMessage.fields.workspace.workspace_id}
          titleLink={titleLink}
          previewLink={previewLink}
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

    if (activity.contentAvailable && activity.contentPath.length > 0) {
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
        () => props.onCopyLinkClicked(activity.content),
        () => props.onEventClicked(activity)
      )
      : <span>{props.t('Unknown activity type')}</span>
    return <div className='activityList__item' data-cy='activityList__item' key={activity.id}>{component}</div>
  }

  // MB - 2021-05-26 - this code is duplicated for activityDisplayFilter, in withActivity
  // See this ticket https://github.com/tracim/tracim/issues/4677

  const isSubscriptionRequestOrRejection = (activity) => {
    return (activity.entityType === TLM_ET.SHAREDSPACE_SUBSCRIPTION &&
      DISPLAYED_SUBSCRIPTION_STATE_LIST.includes(activity.newestMessage.fields.subscription.state))
  }

  const isMemberCreatedOrModified = (activity) => {
    const coreEventType = activity.newestMessage.event_type.split('.')[1]
    return (activity.entityType === TLM_ET.SHAREDSPACE_MEMBER &&
      DISPLAYED_MEMBER_CORE_EVENT_TYPE_LIST.includes(coreEventType))
  }

  const isNotPublicationOrInWorkspaceWithActivatedPublications = (activity) => {
    if (activity.content.content_namespace !== CONTENT_NAMESPACE.PUBLICATION ||
        !activity.newestMessage.fields.workspace) return true
    const currentWorkspace = props.workspaceList.find(ws => ws.id === activity.newestMessage.fields.workspace.workspace_id)
    if (!currentWorkspace) return true
    return currentWorkspace.publicationEnabled
  }

  const activityDisplayFilter = (activity) => {
    return ENTITY_TYPE_COMPONENT_CONSTRUCTOR.has(activity.entityType) &&
      (
        (activity.entityType === TLM_ET.CONTENT && isNotPublicationOrInWorkspaceWithActivatedPublications(activity)) ||
        isSubscriptionRequestOrRejection(activity) ||
        isMemberCreatedOrModified(activity)
      )
  }

  return (
    <div className='activityList'>
      {props.showRefresh && (
        <IconButton
          customClass='activityList__refresh'
          text={props.t('Reorder')}
          icon='fas fa-redo-alt'
          intent='link'
          onClick={props.onRefreshClicked}
          dataCy='activityList__refresh'
        />
      )}
      <div className='activityList__list' data-cy='activityList__list'>
        {(props.activity.list.length > 0
          ? props.activity.list.filter(activityDisplayFilter).map(renderActivityComponent) : (
            <div className='activityList__placeholder'>
              {props.activity.hasNextPage ? props.t('Loading recent activities…') : props.t('No activity')}
            </div>
          )
        )}
      </div>
      {props.activity.list.length > 0 && props.activity.hasNextPage && (
        <IconButton
          text={props.t('See more')}
          icon='fas fa-chevron-down'
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
  onEventClicked: PropTypes.func,
  workspaceList: PropTypes.arrayOf(PropTypes.object)
}

export default translate()(ActivityList)
