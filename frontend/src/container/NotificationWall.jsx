import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import {
  getNotificationList,
  putAllNotificationAsRead
} from '../action-creator.async.js'
import {
  appendNotificationList,
  newFlashMessage,
  readEveryNotification,
  setNextPage
} from '../action-creator.sync.js'
import {
  GROUP_NOTIFICATION_CRITERIA,
  FETCH_CONFIG
} from '../util/helper.js'
import {
  CONTENT_NAMESPACE,
  CONTENT_TYPE,
  getContentPath,
  GROUP_MENTION_TRANSLATION_LIST,
  handleFetchResult,
  Loading,
  NUMBER_RESULTS_BY_PAGE,
  PAGE,
  PROFILE,
  SUBSCRIPTION_TYPE,
  TLM_CORE_EVENT_TYPE as TLM_EVENT,
  TLM_ENTITY_TYPE as TLM_ENTITY,
  TLM_SUB_TYPE as TLM_SUB,
  IconButton,
  ListItemWrapper,
  PopinFixedHeader,
  sortContentByCreatedDateAndID,
  TracimComponent
} from 'tracim_frontend_lib'
import { escape as escapeHtml, uniqBy } from 'lodash'
import NotificationItem from '../component/NotificationItem.jsx'
import GroupedNotificationItem from './GroupedNotificationItem.jsx'

const NUMBER_OF_CRITERIA = {
  ONE: 1,
  TWO: 2
}

const getMainContentId = (notification) => {
  return notification.type.includes(CONTENT_TYPE.COMMENT) ||
    notification.type.includes(CONTENT_TYPE.TODO) ||
    notification.type.includes(TLM_ENTITY.MENTION)
    ? notification.content.parentId
    : notification.content.id
}

const hasSameAuthor = (authorList) => {
  return !authorList.some((author, index) => {
    return !author || (index && author.userId !== authorList[index - 1].userId)
  })
}

const hasSameSpace = (spaceList) => {
  return !spaceList.some((space, index) => {
    return !space || (index && space.id !== spaceList[index - 1].id)
  })
}

const hasSameContent = (notificationList) => {
  if (notificationList.some(notification => !notification.content)) return false
  return notificationList.every((notification, index) => {
    if (index === 0) return true
    return getMainContentId(notification) === getMainContentId(notificationList[index - 1])
  })
}

// INFO - MP - 2022-05-24 - Return true if the notification list can be grouped
const canBeGrouped = (notificationList, numberOfCriteria = NUMBER_OF_CRITERIA.TWO) => {
  const isSameContent = hasSameContent(notificationList)
  const isSameAuthor = hasSameAuthor(notificationList.map(notification => notification.author))
  const isSameSpace = hasSameSpace(notificationList.map(notification => notification.workspace))
  const hasMention = notificationList.some(notification => notification.type.includes(TLM_ENTITY.MENTION))

  const groupedByOneCriteria =
    (numberOfCriteria === NUMBER_OF_CRITERIA.ONE && (isSameContent || isSameAuthor || isSameSpace))

  // INFO - MP - 2022-05-24 - Content && Author or Content && Workspace or Author && Workspace
  const groupedByTwoCriteria =
    (numberOfCriteria === NUMBER_OF_CRITERIA.TWO &&
      (isSameContent ? (isSameAuthor || isSameSpace) : (isSameAuthor && isSameSpace)))

  return !hasMention && (groupedByOneCriteria || groupedByTwoCriteria)
}

// INFO - MP - 2022-05-24 - Add a notification to an existing group
const addNotificationToGroup = (notification, notificationGroup) => {
  notificationGroup.group = sortContentByCreatedDateAndID([notification, ...notificationGroup.group])

  notificationGroup.created = new Date(notification.created).getTime() < new Date(notificationGroup.created).getTime()
    ? notificationGroup.created
    : notification.created
}

// INFO - MP - 2022-05-24 - Check if I can create a group with the three notifications with two criterias
// or six notifications with one criteria
const tryGroupingNotification = (notificationList) => {
  const twoCriteriaList = notificationList.slice(notificationList.length - 3)
  const twoCriteriaListContainsGroup = twoCriteriaList.some(notification => notification.group)
  const oneCriteriaList = notificationList.slice(notificationList.length - 6)
  const oneCriteriaListContainsGroup = oneCriteriaList.some(notification => notification.group)

  let notificationListToReturn = notificationList

  if (!twoCriteriaListContainsGroup) {
    if (twoCriteriaList.length >= 3 && canBeGrouped(twoCriteriaList, NUMBER_OF_CRITERIA.TWO)) {
      const notificationGrouped = createGroupNotificationFromNotificationList(twoCriteriaList)
      notificationListToReturn = [...notificationList.slice(0, notificationList.length - 3), notificationGrouped]
    } else if (oneCriteriaList.length >= 6 && !oneCriteriaListContainsGroup && canBeGrouped(oneCriteriaList, NUMBER_OF_CRITERIA.ONE)) {
      const notificationGrouped = createGroupNotificationFromNotificationList(oneCriteriaList)
      notificationListToReturn = [...notificationList.slice(0, notificationList.length - 6), notificationGrouped]
    }
  }

  // INFO - MP - 2022-07-05 - If there is a group, we add it at the end of the group
  return notificationListToReturn
}

// INFO - MP - 2022-05-24 - Create a notification group from a notification list
const createGroupNotificationFromNotificationList = (notificationList) => {
  const groupedNotification = {
    created: notificationList[0].created,
    group: [],
    id: notificationList[0].id,
    type: ''
  }

  const isGroupedByContent = hasSameContent(notificationList)
  const isGroupedByAuthor = hasSameAuthor(notificationList.map(notification => notification.author))
  const isGroupedBySpace = hasSameSpace(notificationList.map(notification => notification.workspace))
  const numberOfCriteria =
    (isGroupedByContent ? 1 : 0) +
    (isGroupedByAuthor ? 1 : 0) +
    (isGroupedBySpace ? 1 : 0)

  groupedNotification.type = `${numberOfCriteria}` +
    `${isGroupedByContent ? `.${GROUP_NOTIFICATION_CRITERIA.CONTENT}` : ''}` +
    `${isGroupedByAuthor ? `.${GROUP_NOTIFICATION_CRITERIA.AUTHOR}` : ''}` +
    `${isGroupedBySpace ? `.${GROUP_NOTIFICATION_CRITERIA.WORKSPACE}` : ''}`

  notificationList.forEach(notification => {
    addNotificationToGroup(notification, groupedNotification)
  })

  const authorList = uniqBy(notificationList.map(notification => notification.author), 'userId')
  groupedNotification.author = authorList

  return groupedNotification
}

const createNotificationListWithGroupsFromFlatNotificationList = (notificationList) => {
  const minimumOfNotificationsToGroup = 3
  let groupedNotificationList = []

  notificationList.forEach((notification, index) => {
    const listLenght = groupedNotificationList.length
    // INFO - MP - 2022-07-05 - We can't group less than 3 notifications and can't group mention
    if (notification.type.includes(TLM_ENTITY.MENTION) || index < minimumOfNotificationsToGroup - 1) {
      groupedNotificationList.push(notification)
      return
    }

    const previousNotification = groupedNotificationList[listLenght - 1]
    // INFO - MP - 2022-07-05 - If there is a group, I check if I can add it to the existing group
    // overwise I'm trying to create a group with the three or six last notifications
    if (previousNotification.group) {
      // INFO - MP - 2022-05-25 - Because it's a group I can check if the first notification is groupable
      // to my current notification
      if (canBeGrouped([previousNotification.group[0], notification])) {
        groupedNotificationList[listLenght - 1] = {
          ...previousNotification,
          group: [...previousNotification.group, notification]
        }
      } else {
        groupedNotificationList.push(notification)
      }
    } else {
      groupedNotificationList.push(notification)
      groupedNotificationList = tryGroupingNotification(groupedNotificationList)
    }
  })

  return groupedNotificationList
}

const linkToParentContent = (notification) => {
  return PAGE.CONTENT(notification.content.parentId)
}

export const NotificationWall = props => {
  const [notificationList, setNotificationList] = useState([])
  // INFO - GB -2022-06-05 - The no set below is not used because folderPath is a dictionary and the manipulations are done directly
  const [folderPath, setFolderPath] = useState({}) // eslint-disable-line no-unused-vars
  const [isFolderPathLoading, setIsFolderPathLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // INFO - MP - 2022-05-20 - If we change the height, we need to change the
  // height of notification item in the css.
  const NOTIFICATION_ITEM_HEIGHT = 60

  useEffect(() => {
    if (props.user.userId !== -1) {
      loadNotifications()
    }
  }, [props.user.userId])

  // INFO - MP - 2022-05-20 - This effect is used to recreate the notification
  // list with groups and fetch more notifications if needed.
  useEffect(() => {
    setIsFolderPathLoading(true)

    const newNotificationList = createNotificationListWithGroupsFromFlatNotificationList(props.notificationPage.list)

    props.notificationPage.list.forEach(async notification => {
      if (notification.type === `${TLM_ENTITY.CONTENT}.${TLM_EVENT.CREATED}.${TLM_SUB.FOLDER}`) {
        const fetchGetContentPath = await handleFetchResult(await getContentPath(FETCH_CONFIG.apiUrl, notification.content.id))
        if (fetchGetContentPath.apiResponse.status === 200) {
          folderPath[notification.content.id] = fetchGetContentPath.body.items.map(content => content.content_id)
        }
      }
    })

    setIsFolderPathLoading(false)
    setNotificationList(newNotificationList)
  }, [props.notificationPage.list])

  useEffect(() => {
    const notificationListHeight = notificationList.length * NOTIFICATION_ITEM_HEIGHT
    const shouldLoadMore = notificationListHeight < window.innerHeight
    if (shouldLoadMore && props.notificationPage.hasNextPage) {
      setIsLoading(true)
      loadNotifications()
    }
  }, [notificationList])

  const handleClickMarkAllAsRead = async () => {
    const fetchAllPutNotificationAsRead = await props.dispatch(putAllNotificationAsRead(props.user.userId))
    switch (fetchAllPutNotificationAsRead.status) {
      case 204:
        props.dispatch(readEveryNotification())
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened while setting "mark all as read"'), 'warning'))
    }
  }

  const loadNotifications = async () => {
    if (props.notificationPage.hasNextPage || props.notificationPage.list.length === 0) {
      const fetchGetNotificationWall = await props.dispatch(getNotificationList(
        props.user.userId,
        {
          excludeAuthorId: props.user.userId,
          notificationsPerPage: NUMBER_RESULTS_BY_PAGE,
          nextPageToken: props.notificationPage.nextPageToken
        }
      ))
      switch (fetchGetNotificationWall.status) {
        case 200:
          // INFO - MP - 2022-05-23 - We need to set the next page first and update the list of notifications
          // after, so the hook isn't triggered too early.
          props.dispatch(setNextPage(fetchGetNotificationWall.json.has_next, fetchGetNotificationWall.json.next_page_token))
          props.dispatch(
            appendNotificationList(
              props.user.userId,
              fetchGetNotificationWall.json.items,
              props.workspaceList
            )
          )
          break
        default:
          props.dispatch(newFlashMessage(props.t('Error while loading the notification list'), 'warning'))
      }
    }
    setIsLoading(false)
  }

  const handleScroll = (e) => {
    const element = e.target
    if (props.notificationPage.hasNextPage && !isLoading) {
      if (element.scrollHeight - element.scrollTop <= element.clientHeight + 2 * NOTIFICATION_ITEM_HEIGHT) {
        setIsLoading(true)
        loadNotifications()
      }
    }
  }

  const getNotificationDetails = (notification) => {
    const [entityType, eventType, contentType] = notification.type.split('.')
    const escapedAuthor = notification.author ? escapeHtml(notification.author.publicName) : ''
    const escapedUser = notification.user ? escapeHtml(notification.user.publicName) : ''
    const escapedContentLabel = (
      notification.content
        ? escapeHtml(
          ((contentType === TLM_SUB.COMMENT) ||
            (contentType === TLM_SUB.TODO) ||
            (entityType === TLM_ENTITY.MENTION && notification.content.type === CONTENT_TYPE.COMMENT))
            ? notification.content.parentLabel
            : notification.content.label
        )
        : ''
    )
    const escapedToDoLabel = (
      notification.content
        ? notification.content.toDoLabel
          ? escapeHtml(notification.content.toDoLabel)
          : props.t('a task')
        : ''
    )
    const hasToDo = notification.content ? notification.content.hasToDo : false

    const numberOfContents = notification.numberOfContents || 1
    const i18nOpts = {
      user: `<span title='${escapedUser}'>${escapedUser}</span>`,
      author: `<span title='${escapedAuthor}'>${escapedAuthor}</span>`,
      content: hasToDo
        ? `<span title='${escapedContentLabel}' class='contentTitle__highlight'>${escapedContentLabel}</span>`
        : `<span title='${escapedContentLabel}' class='${numberOfContents === 1
            ? 'contentTitle__highlight'
            : ''
          }'>${escapedContentLabel}</span>`,
      task: `<span title='${escapedToDoLabel}'>${escapedToDoLabel}</span>`,
      interpolation: { escapeValue: false }
    }

    if (notification.numberOfWorkspaces > 1) {
      i18nOpts.workspaceInfo = `<span title='${notification.numberOfWorkspaces}'>${
        props.t(' in {{count}} spaces', { count: notification.numberOfWorkspaces })
      }</span>`
    }

    const isPublication = notification.content && notification.content.contentNamespace === CONTENT_NAMESPACE.PUBLICATION

    let contentUrl = notification.content ? PAGE.CONTENT(notification.content.id) : ''

    if (entityType === TLM_ENTITY.CONTENT) {
      switch (eventType) {
        case TLM_EVENT.CREATED: {
          if (contentType === TLM_SUB.FOLDER && folderPath[notification.content.id]) {
            contentUrl = PAGE.WORKSPACE.FOLDER_OPEN(
              notification.workspace.id,
              folderPath[notification.content.id]
            )
          }

          if (contentType === TLM_SUB.COMMENT) {
            return {
              title: props.t('Comment_noun'),
              text: props.t('{{author}} commented on {{content}}{{workspaceInfo}}', i18nOpts),
              url: linkToParentContent(notification)
            }
          }

          if (contentType === TLM_SUB.TODO) {
            return {
              title: props.t('Task to do created'),
              text: props.t('{{author}} created {{task}} on {{content}}{{workspaceInfo}}', i18nOpts),
              url: linkToParentContent(notification),
              isToDo: true
            }
          }

          return {
            title: isPublication ? props.t('New publication') : props.t('New content'),
            text: props.t('{{author}} created {{content}}{{workspaceInfo}}', i18nOpts),
            url: contentUrl
          }
        }
        case TLM_EVENT.MODIFIED: {
          if (notification.content.currentRevisionType === 'status-update') {
            if (contentType === TLM_SUB.TODO) {
              return {
                title: props.t('Task updated'),
                text: props.t('{{author}} updated {{task}} on {{content}}{{workspaceInfo}}', i18nOpts),
                url: linkToParentContent(notification),
                isToDo: true
              }
            }

            return {
              title: props.t('Status updated'),
              text: props.t('{{author}} changed the status of {{content}}{{workspaceInfo}}', i18nOpts),
              url: contentUrl
            }
          }

          return {
            title: isPublication ? props.t('Publication updated') : props.t('Content updated'),
            text: props.t('{{author}} updated {{content}}{{workspaceInfo}}', i18nOpts),
            url: contentUrl
          }
        }
        case TLM_EVENT.DELETED: {
          if (contentType === TLM_SUB.TODO) {
            return {
              title: props.t('Task deleted'),
              text: props.t('{{author}} deleted {{task}} on {{content}}{{workspaceInfo}}', i18nOpts),
              url: linkToParentContent(notification),
              isToDo: true
            }
          }

          return {
            title: isPublication ? props.t('Publication deleted') : props.t('Content deleted'),
            text: props.t('{{author}} deleted {{content}}{{workspaceInfo}}', i18nOpts),
            url: contentUrl
          }
        }
        case TLM_EVENT.UNDELETED: {
          return {
            title: isPublication ? props.t('Publication restored') : props.t('Content restored'),
            text: props.t('{{author}} restored {{content}}{{workspaceInfo}}', i18nOpts),
            url: contentUrl
          }
        }
      }
    }

    if (entityType === TLM_ENTITY.MENTION && eventType === TLM_EVENT.CREATED) {
      const groupMention = GROUP_MENTION_TRANSLATION_LIST.includes(notification.mention.recipient)
      const mentionEveryone = props.t('{{author}} mentioned everyone in {{content}}', i18nOpts)
      const mentionYou = props.t('{{author}} mentioned you in {{content}}', i18nOpts)
      const isHtmlDocument = notification.content.type === CONTENT_TYPE.HTML_DOCUMENT

      return {
        title: props.t('Mention'),
        text: groupMention ? mentionEveryone : mentionYou,
        url: PAGE.CONTENT(isHtmlDocument
          ? notification.content.id
          : notification.content.parentId
        ),
        isMention: true
      }
    }

    if (entityType === TLM_ENTITY.USER) {
      const details = {
        url: (props.user.profile === PROFILE.administrator.slug)
          ? PAGE.ADMIN.USER_EDIT(notification.user.userId)
          : PAGE.PUBLIC_PROFILE(notification.user.userId),
        emptyUrlMsg: props.t("Only an administrator can see this user's account"),
        msgType: 'info'
      }

      if (notification.author.userId === notification.user.userId) {
        switch (eventType) {
          case TLM_EVENT.CREATED: return {
            ...details,
            title: props.t('Account created'),
            text: props.t('{{author}} created their account', i18nOpts)
          }
          case TLM_EVENT.MODIFIED: return {
            ...details,
            title: props.t('Account updated'),
            text: props.t('{{author}} modified their account', i18nOpts)
          }
          case TLM_EVENT.DELETED: return {
            ...details,
            title: props.t('Account deleted'),
            text: props.t('{{author}} deleted their account', i18nOpts)
          }
          case TLM_EVENT.UNDELETED: return {
            ...details,
            title: props.t('Account restored'),
            text: props.t('{{author}} restored their account', i18nOpts)
          }
        }
      } else {
        switch (eventType) {
          case TLM_EVENT.CREATED: return {
            ...details,
            title: props.t('Account created'),
            text: props.t("{{author}} created <b>{{user}}</b>'s account", i18nOpts)
          }
          case TLM_EVENT.MODIFIED: return {
            ...details,
            title: props.t('Account updated'),
            text: props.t("{{author}} modified <b>{{user}}</b>'s account", i18nOpts)
          }
          case TLM_EVENT.DELETED: return {
            ...details,
            title: props.t('Account deleted'),
            text: props.t("{{author}} deleted <b>{{user}}</b>'s account", i18nOpts)
          }
          case TLM_EVENT.UNDELETED: return {
            ...details,
            title: props.t('Account restored'),
            text: props.t("{{author}} restored <b>{{user}}</b>'s account", i18nOpts)
          }
        }
      }
    }

    const dashboardUrl = notification.workspace ? PAGE.WORKSPACE.DASHBOARD(notification.workspace.id) : ''

    if (entityType === TLM_ENTITY.SHAREDSPACE_MEMBER) {
      switch (eventType) {
        case TLM_EVENT.CREATED: {
          return {
            title: props.t('New access'),
            text: props.user.userId === notification.user.userId
              ? props.t('{{author}} added you to a space', i18nOpts)
              : (
                notification.author.userId === notification.user.userId
                  ? props.t('{{author}} joined a space', i18nOpts)
                  : props.t('{{author}} added <b>{{user}}</b> to a space', i18nOpts)
              ),
            url: dashboardUrl
          }
        }
        case TLM_EVENT.MODIFIED: return {
          title: props.t('Status updated'),
          text: props.user.userId === notification.user.userId
            ? props.t('{{author}} modified your role in a space', i18nOpts)
            : (
              notification.author.userId === notification.user.userId
                ? props.t('{{author}} modified their role in a space', i18nOpts)
                : props.t("{{author}} modified <b>{{user}}</b>'s role in a space", i18nOpts)
            ),
          url: dashboardUrl
        }
        case TLM_EVENT.DELETED: return {
          title: props.t('Access removed'),
          text: props.user.userId === notification.user.userId
            ? props.t('{{author}} removed you from a space', i18nOpts)
            : (
              notification.author.userId === notification.user.userId
                ? props.t('{{author}} removed themself from a space', i18nOpts)
                : props.t('{{author}} removed <b>{{user}}</b> from a space', i18nOpts)
            ),
          url: dashboardUrl
        }
      }
    }

    if (entityType === TLM_ENTITY.SHAREDSPACE) {
      switch (eventType) {
        case TLM_EVENT.CREATED: return {
          title: props.t('New space'),
          text: props.t('{{author}} created a space', i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.MODIFIED: return {
          title: props.t('Space updated'),
          text: props.t('{{author}} modified a space', i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.DELETED: return {
          title: props.t('Space deleted'),
          text: props.t('{{author}} deleted a space', i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.UNDELETED: return {
          title: props.t('Space restored'),
          text: props.t('{{author}} restored a space', i18nOpts),
          url: dashboardUrl
        }
      }
    }

    const defaultEmptyUrlMsg = props.t('This notification has no associated content')
    const subscriptionPageURL = '' // RJ - 2020-10-19 - FIXME: depends on https://github.com/tracim/tracim/issues/3594
    const advancedDashboardUrl = notification.workspace ? PAGE.WORKSPACE.ADVANCED_DASHBOARD(notification.workspace.id) : ''

    if (entityType === TLM_ENTITY.SHAREDSPACE_SUBSCRIPTION) {
      // INFO - GB - 2020-12-29 - MODIFIED.accepted and DELETED events do not make notifications

      if (props.user.userId === notification.subscription.author.userId) {
        // INFO - RJ - 2020-10-19 - TLM_EVENT.CREATED notifications should not be shown, or even received
        // assuming that the author of a subscription is always the concerned user
        if (eventType === TLM_EVENT.MODIFIED) {
          if (notification.subscription.state === SUBSCRIPTION_TYPE.accepted.slug) return {}
          if (notification.subscription.state === SUBSCRIPTION_TYPE.rejected.slug) {
            return {
              title: props.t('Access removed'),
              text: props.t('{{author}} rejected your access to a space', i18nOpts),
              url: subscriptionPageURL,
              emptyUrlMsg: defaultEmptyUrlMsg
            }
          }
        }
      } else {
        switch (eventType) {
          case TLM_EVENT.CREATED: return {
            title: props.t('Requested access'),
            text: props.t('{{author}} requested access to a space', i18nOpts),
            url: advancedDashboardUrl
          }
          case TLM_EVENT.MODIFIED: {
            if (notification.subscription.state === SUBSCRIPTION_TYPE.accepted.slug) return {}
            if (notification.subscription.state === SUBSCRIPTION_TYPE.rejected.slug) {
              return {
                title: props.t('Access removed'),
                text: props.t('{{author}} rejected access a space for <b>{{user}}</b>', i18nOpts),
                url: defaultEmptyUrlMsg
              }
            }

            if (notification.subscription.state === SUBSCRIPTION_TYPE.pending.slug) {
              return {
                title: props.t('Requested access'),
                text: props.t('{{author}} requested access to a space', i18nOpts),
                url: advancedDashboardUrl
              }
            }
          }
        }
      }
    }

    if (entityType === TLM_ENTITY.REACTION) {
      i18nOpts.reaction = notification.reaction.value

      switch (eventType) {
        case TLM_EVENT.CREATED: return {
          title: props.t('Reaction created'),
          text: props.t('{{author}} reacted to {{content}} with {{reaction}}', i18nOpts),
          url: contentUrl
        }
        case TLM_EVENT.DELETED: return {
          title: props.t('Reaction deleted'),
          text: props.t('{{author}} removed their reaction {{reaction}} to {{content}}', i18nOpts),
          url: contentUrl
        }
      }
    }

    if (entityType === TLM_ENTITY.USER_CALL) {
      switch (eventType) {
        case TLM_EVENT.MODIFIED:
          return {
            title: props.t('{{author}} called you'),
            text: props.t('{{author}} called you', i18nOpts),
            url: PAGE.PUBLIC_PROFILE(notification.author.userId)
          }
        default:
          break
      }
    }

    return {
      text: `${escapedAuthor} ${notification.type}`,
      url: contentUrl,
      emptyUrlMsg: defaultEmptyUrlMsg,
      msgType: 'warning'
    }
  }

  return (
    isFolderPathLoading
      ? <Loading />
      : (
        <div className={classnames('notification', { notification__wallClose: !props.isNotificationWallOpen })}>
          <PopinFixedHeader
            customClass='notification'
            faIcon='far fa-bell'
            rawTitle={props.t('Notifications')}
            componentTitle={<span className='componentTitle'>{props.t('Notifications')}</span>}
            onClickCloseBtn={props.onCloseNotificationWall}
          >
            <IconButton
              mode='dark'
              onClick={handleClickMarkAllAsRead}
              icon='far fa-envelope-open'
              text={props.t('Mark all as read')}
              dataCy='markAllAsReadButton'
            />
          </PopinFixedHeader>

          <div className='notification__list' onScroll={handleScroll}>
            {notificationList.length !== 0 && notificationList.map((notification, i) => {
              if (notification.group) {
                return (
                  <GroupedNotificationItem
                    getNotificationDetails={getNotificationDetails}
                    groupedNotifications={notification}
                    isFirst={i === 0}
                    isLast={i === notificationList.length - 1}
                    isSameContent={notification.type.includes(GROUP_NOTIFICATION_CRITERIA.CONTENT)}
                    key={notification.id}
                    onCloseNotificationWall={props.onCloseNotificationWall}
                    read={false}
                  />
                )
              } else {
                return (
                  <ListItemWrapper
                    isFirst={i === 0}
                    isLast={i === notificationList.length - 1}
                    read={false}
                    key={notification.id}
                  >
                    <NotificationItem
                      onCloseNotificationWall={props.onCloseNotificationWall}
                      getNotificationDetails={getNotificationDetails}
                      notification={notification}
                    />
                  </ListItemWrapper>
                )
              }
            })}

          </div>
        </div>
      )
  )
}

const mapStateToProps = ({ user, notificationPage, workspaceList }) => ({ user, notificationPage, workspaceList })
export default connect(mapStateToProps)(translate()(TracimComponent(NotificationWall)))
