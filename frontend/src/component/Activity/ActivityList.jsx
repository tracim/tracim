import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  CONTENT_NAMESPACE,
  CONTENT_TYPE,
  PAGE,
  TLM_ENTITY_TYPE as TLM_ET,
  EmptyListMessage,
  IconButton,
  Loading,
  serialize
} from 'tracim_frontend_lib'
import { serializeContentProps } from '../../reducer/workspaceContentList.js'
import FeedItemWithPreview from '../../container/FeedItemWithPreview.jsx'
import ContentWithoutPreviewActivity from './ContentWithoutPreviewActivity.jsx'
import MemberActivity from './MemberActivity.jsx'
import {
  activityDisplayFilter
} from '../../util/activity.js'

require('./ActivityList.styl')

const ENTITY_TYPE_COMPONENT_CONSTRUCTOR = new Map([
  [TLM_ET.CONTENT, (activity, breadcrumbsList, onCopyLinkClicked, onEventClicked) => {
    const [entityType, coreEventType, subEntityType] = activity.newestMessage.event_type.split('.')
    const isPublication = activity.content.content_namespace === CONTENT_NAMESPACE.PUBLICATION
    const openInAppLink = PAGE.WORKSPACE.CONTENT(activity.content.workspace_id, activity.content.content_type, activity.content.content_id)
    const titleLink = openInAppLink
    const previewLink = openInAppLink
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
          showParticipateButton
          // INFO - GB - 2022-08-23 - The line bellow call Object.prototype to not trigger the no-prototype-builtins linting error
          // See https://ourcodeworld.com/articles/read/1425/how-to-fix-eslint-error-do-not-access-objectprototype-method-hasownproperty-from-target-object-no-prototype-builtins
          showCommentList={Object.prototype.hasOwnProperty.call(activity, 'commentList')}
        />
      )
  }],
  [TLM_ET.SHAREDSPACE_MEMBER, (activity) => <MemberActivity activity={activity} key={activity.id} />],
  [TLM_ET.SHAREDSPACE_SUBSCRIPTION, (activity) => <MemberActivity activity={activity} key={activity.id} />],
  [TLM_ET.SHAREDSPACE, (activity) => <MemberActivity activity={activity} key={activity.id} />]
])
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
      const contentPathList = activity.contentPath.map(content => content.content_id)
      return [
        dashboardBreadcrumb,
        ...activity.contentPath.map(crumb => ({
          label: crumb.label,
          link: crumb.content_type === CONTENT_TYPE.FOLDER
            ? PAGE.WORKSPACE.FOLDER_OPEN(workspace.workspace_id, contentPathList)
            : PAGE.WORKSPACE.CONTENT(workspace.workspace_id, crumb.content_type, crumb.content_id),
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

  const activityList = props.activity.list.filter(
    (activity) => activityDisplayFilter(
      activity,
      props.workspaceList,
      props.userId
    )
  ).map(renderActivityComponent)

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
        {(activityList.length > 0
          ? activityList
          : (
            <div className='activityList__placeholder'>
              {props.activity.hasNextPage ? (
                <Loading
                  height={100}
                  text={props.t('Loading recent activities…')}
                  width={100}
                />
              ) : (
                <EmptyListMessage>
                  {props.t('No activity')}
                </EmptyListMessage>
              )}
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
  userId: PropTypes.number.isRequired,
  onEventClicked: PropTypes.func,
  workspaceList: PropTypes.arrayOf(PropTypes.object)
}

export default translate()(ActivityList)
