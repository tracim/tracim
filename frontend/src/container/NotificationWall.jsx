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
  readNotificationList,
  setNextPage
} from '../action-creator.sync.js'
import {
  CONTENT_NAMESPACE,
  GROUP_NOTIFICATION_CRITERIA
} from '../util/helper.js'
import {
  CONTENT_TYPE,
  GROUP_MENTION_TRANSLATION_LIST,
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
  TracimComponent
} from 'tracim_frontend_lib'
import { cloneDeep, escape as escapeHtml, uniqBy } from 'lodash'
import NotificationItem from '../component/NotificationItem.jsx'
import GroupedNotificationItem from './GroupedNotificationItem.jsx'

export const NotificationWall = props => {
  const [notificationList, setNotificationList] = useState([])

  const NUMBER_OF_CRITERIA = {
    ONE: 1,
    TWO: 2
  }

  useEffect(() => {
    let tmpNotificationList = []
    props.notificationPage.list.forEach(notification => {
      let newNotificationList = cloneDeep(tmpNotificationList)
      if (!belongsToGroup(notification, newNotificationList[0], NUMBER_OF_CRITERIA.TWO)) {
        if (!belongsToGroup(notification, newNotificationList[0], NUMBER_OF_CRITERIA.ONE)) {
          newNotificationList = groupNotificationListWithTwoCriteria(uniqBy([...newNotificationList, notification], 'id'))
        }
      }
      tmpNotificationList = newNotificationList
    })

    setNotificationList(tmpNotificationList)
  }, [props.notificationPage.list])

  const hasSameAuthor = authorList => {
    return !authorList.some((author, index) => {
      return !author || (index && author.userId !== authorList[index - 1].userId)
    })
  }

  const hasSameWorkspace = workspaceList => {
    return !workspaceList.some((workspace, index) => {
      return !workspace || (index && workspace.id !== workspaceList[index - 1].id)
    })
  }

  const hasSameContent = notificationList => {
    if (notificationList.some(notification => !notification.content)) return false
    return notificationList.every((notification, index) => {
      if (index === 0) return true
      return getMainContentId(notification) === getMainContentId(notificationList[index - 1])
    })
  }

  const belongsToGroup = (notification, groupedNotification, numberOfCriteria = NUMBER_OF_CRITERIA.TWO) => {
    if (!groupedNotification || !groupedNotification.group) return false

    const isGroupedByContent = groupedNotification.type.includes(GROUP_NOTIFICATION_CRITERIA.CONTENT) &&
      hasSameContent([notification, groupedNotification])

    const isGroupedByWorkspace = groupedNotification.type.includes(GROUP_NOTIFICATION_CRITERIA.WORKSPACE) &&
      hasSameWorkspace([notification.workspace, groupedNotification.group[0].workspace])

    const isGroupedByAuthor = groupedNotification.type.includes(GROUP_NOTIFICATION_CRITERIA.AUTHOR) &&
      hasSameAuthor([notification.author, groupedNotification.group[0].author])

    const groupedByOneCriteria =
      (numberOfCriteria === NUMBER_OF_CRITERIA.ONE && (isGroupedByContent || isGroupedByAuthor || isGroupedByWorkspace))

    const groupedByTwoCriteria =
      (numberOfCriteria === NUMBER_OF_CRITERIA.TWO &&
        (isGroupedByContent ? (isGroupedByAuthor || isGroupedByWorkspace) : (isGroupedByAuthor && isGroupedByWorkspace)))

    if (groupedByOneCriteria || groupedByTwoCriteria) {
      groupedNotification.group = sortByCreatedDate([notification, ...groupedNotification.group])

      groupedNotification.type = `${numberOfCriteria}` +
        `${isGroupedByContent ? `.${GROUP_NOTIFICATION_CRITERIA.CONTENT}` : ''}` +
        `${isGroupedByAuthor ? `.${GROUP_NOTIFICATION_CRITERIA.AUTHOR}` : ''}` +
        `${isGroupedByWorkspace ? `.${GROUP_NOTIFICATION_CRITERIA.WORKSPACE}` : ''}`

      groupedNotification.created = new Date(notification.created).getTime() < new Date(groupedNotification.created).getTime()
        ? groupedNotification.created
        : notification.created
      return true
    }
  }

  const groupNotificationListWithTwoCriteria = (notificationList) => {
    const numberOfNotificationsToGroup = 3
    const newNotificationList = []
    let indexInNewList = 0

    notificationList.forEach((notification, index) => {
      if (index < (numberOfNotificationsToGroup - 1) || notification.type.includes(TLM_ENTITY.MENTION)) {
        indexInNewList++
        newNotificationList.push(notification)
        return
      }

      const previousNotificationInNewList = newNotificationList[indexInNewList - 1]
      if (belongsToGroup(notification, previousNotificationInNewList, NUMBER_OF_CRITERIA.TWO)) return
      else {
        addNewNotificationGroup(
          notification,
          newNotificationList,
          indexInNewList,
          numberOfNotificationsToGroup,
          NUMBER_OF_CRITERIA.TWO
        )
        if (newNotificationList.length !== indexInNewList) {
          indexInNewList = newNotificationList.length
          return
        }
      }

      indexInNewList++
      newNotificationList.push(notification)
    })

    return groupNotificationListWithOneCriteria(newNotificationList)
  }

  const groupNotificationListWithOneCriteria = (notificationList) => {
    const numberOfNotificationsToGroup = 6
    const newNotificationList = []
    let indexInNewList = 0

    notificationList.forEach((notification, index) => {
      if (index < numberOfNotificationsToGroup - 1 || notification.type.includes(TLM_ENTITY.MENTION) || notification.group) {
        indexInNewList++
        newNotificationList.push(notification)
        return
      }

      const previousNotificationInNewList = newNotificationList[indexInNewList - 1]

      if (previousNotificationInNewList.type.startsWith(NUMBER_OF_CRITERIA.TWO)) {
        indexInNewList++
        newNotificationList.push(notification)
        return
      }
      if (belongsToGroup(notification, previousNotificationInNewList, NUMBER_OF_CRITERIA.ONE)) return
      else {
        addNewNotificationGroup(
          notification,
          newNotificationList,
          indexInNewList,
          numberOfNotificationsToGroup,
          NUMBER_OF_CRITERIA.ONE
        )
        if (newNotificationList.length !== indexInNewList) {
          indexInNewList = newNotificationList.length
          return
        }
      }

      indexInNewList++
      newNotificationList.push(notification)
    })
    return newNotificationList
  }

  const addNewNotificationGroup = (notification, newNotificationList, indexInNewList, numberOfNotificationsToGroup, numberOfCriteria = NUMBER_OF_CRITERIA.TWO) => {
    if (
      indexInNewList >= (numberOfNotificationsToGroup - 1) &&
      !newNotificationList
        .slice(indexInNewList - (numberOfNotificationsToGroup - 1), indexInNewList)
        .some(notification => notification.group)
    ) {
      const previousNotificationList = newNotificationList
        .slice(indexInNewList - (numberOfNotificationsToGroup - 1), indexInNewList)
      const isGroupedByAuthor = hasSameAuthor([notification.author, ...previousNotificationList.map(notification => notification.author)])
      const isGroupedByWorkspace = hasSameWorkspace([notification.workspace, ...previousNotificationList.map(notification => notification.workspace)])
      const isGroupedByContent = hasSameContent([notification, ...previousNotificationList])

      if (
        ((numberOfCriteria === NUMBER_OF_CRITERIA.TWO &&
          (isGroupedByContent ? (isGroupedByAuthor || isGroupedByWorkspace) : (isGroupedByAuthor && isGroupedByWorkspace))) ||
          (numberOfCriteria === NUMBER_OF_CRITERIA.ONE && (isGroupedByContent || isGroupedByAuthor || isGroupedByWorkspace))
        ) &&
        (!previousNotificationList.some(notification => notification.type.includes(TLM_ENTITY.MENTION)))
      ) {
        const authorList = uniqBy([
          notification.author,
          ...previousNotificationList.map(notification => notification.author)
        ], 'userId')

        for (let i = 0; i < (numberOfNotificationsToGroup - 1); i++) newNotificationList.pop()
        const notificationGroupList = sortByCreatedDate([notification, ...previousNotificationList])
        const groupType = `${numberOfCriteria}` +
          `${isGroupedByContent ? `.${GROUP_NOTIFICATION_CRITERIA.CONTENT}` : ''}` +
          `${isGroupedByAuthor ? `.${GROUP_NOTIFICATION_CRITERIA.AUTHOR}` : ''}` +
          `${isGroupedByWorkspace ? `.${GROUP_NOTIFICATION_CRITERIA.WORKSPACE}` : ''}`

        newNotificationList.push({
          author: authorList,
          created: notificationGroupList[0].created,
          id: notification.id,
          type: groupType,
          group: notificationGroupList
        })
      }
    }
  }

  const sortByCreatedDate = (arrayToSort) => {
    return arrayToSort.sort(function (a, b) {
      if (a.created < b.created) return 1
      if (a.created > b.created) return -1
      return 0
    })
  }

  const getMainContentId = (notification) => {
    return notification.type.includes(CONTENT_TYPE.COMMENT) || notification.type.includes(TLM_ENTITY.MENTION)
      ? notification.content.parentId
      : notification.content.id
  }

  const handleClickSeeMore = async () => {
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
        props.dispatch(appendNotificationList(fetchGetNotificationWall.json.items))
        props.dispatch(setNextPage(fetchGetNotificationWall.json.has_next, fetchGetNotificationWall.json.next_page_token))
        break
      default:
        props.dispatch(newFlashMessage(props.t('Error while loading the notification list'), 'warning'))
    }
  }

  const getNotificationDetails = notification => {
    const [entityType, eventType, contentType] = notification.type.split('.')

    const escapedAuthor = notification.author ? escapeHtml(notification.author.publicName) : ''
    const escapedUser = notification.user ? escapeHtml(notification.user.publicName) : ''

    const escapedContentLabel = (
      notification.content
        ? escapeHtml(
          ((contentType === TLM_SUB.COMMENT) || (entityType === TLM_ENTITY.MENTION && notification.content.type === CONTENT_TYPE.COMMENT))
            ? notification.content.parentLabel
            : notification.content.label
        )
        : ''
    )

    const numberOfContents = notification.numberOfContents || 1

    const i18nOpts = {
      user: `<span title='${escapedUser}'>${escapedUser}</span>`,
      author: `<span title='${escapedAuthor}'>${escapedAuthor}</span>`,
      content: `<span title='${escapedContentLabel}' class='${numberOfContents === 1
        ? 'contentTitle__highlight'
        : ''
      }'>${escapedContentLabel}</span>`,
      interpolation: { escapeValue: false }
    }

    if (notification.numberOfWorkspaces > 1) {
      i18nOpts.workspaceInfo = `<span title='${notification.numberOfWorkspaces}'>${
        props.t(' in {{count}} spaces', { count: notification.numberOfWorkspaces })
      }</span>`
    }

    const isPublication = notification.content && notification.content.contentNamespace === CONTENT_NAMESPACE.PUBLICATION

    const contentUrl = notification.content ? PAGE.CONTENT(notification.content.id) : ''

    if (entityType === TLM_ENTITY.CONTENT) {
      switch (eventType) {
        case TLM_EVENT.CREATED: {
          if (contentType === TLM_SUB.COMMENT) {
            return {
              title: props.t('Comment_noun'),
              text: props.t('{{author}} commented on {{content}}{{workspaceInfo}}', i18nOpts),
              url: linkToComment(notification)
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

  const handleClickMarkAllAsRead = async () => {
    const fetchAllPutNotificationAsRead = await props.dispatch(putAllNotificationAsRead(props.user.userId))
    switch (fetchAllPutNotificationAsRead.status) {
      case 204:
        props.dispatch(readNotificationList())
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened while setting "mark all as read"'), 'warning'))
    }
  }

  const linkToComment = notification => {
    return PAGE.CONTENT(notification.content.parentId)
  }

  return (
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

      <div className='notification__list'>
        {notificationList.length !== 0 && notificationList.map((notification, i) => {
          return (
            <ListItemWrapper
              isLast={i === notificationList.length - 1}
              isFirst={i === 0}
              read={false}
              key={notification.id}
            >
              {notification.group
                ? (
                  <GroupedNotificationItem
                    onCloseNotificationWall={props.onCloseNotificationWall}
                    getNotificationDetails={getNotificationDetails}
                    groupedNotifications={notification}
                    isSameContent={notification.type.includes(GROUP_NOTIFICATION_CRITERIA.CONTENT)}
                  />
                )
                : (
                  <NotificationItem
                    onCloseNotificationWall={props.onCloseNotificationWall}
                    getNotificationDetails={getNotificationDetails}
                    notification={notification}
                  />
                )}
            </ListItemWrapper>
          )
        })}

        {props.notificationPage.hasNextPage &&
          <div className='notification__footer'>
            <IconButton
              mode='dark'
              onClick={handleClickSeeMore}
              icon='fas fa-chevron-down'
              text={props.t('See more')}
            />
          </div>}
      </div>
    </div>
  )
}

const mapStateToProps = ({ user, notificationPage }) => ({ user, notificationPage })
export default connect(mapStateToProps)(translate()(TracimComponent(NotificationWall)))
