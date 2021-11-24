import React from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import {
  getNotificationList,
  putAllNotificationAsRead,
  putNotificationAsRead
} from '../action-creator.async.js'
import {
  appendNotificationList,
  newFlashMessage,
  readNotification,
  readNotificationList,
  setNextPage
} from '../action-creator.sync.js'
import {
  CONTENT_NAMESPACE
} from '../util/helper.js'
import {
  CONTENT_TYPE,
  IconButton,
  GROUP_MENTION_TRANSLATION_LIST,
  PROFILE,
  ListItemWrapper,
  TLM_CORE_EVENT_TYPE as TLM_EVENT,
  TLM_ENTITY_TYPE as TLM_ENTITY,
  TLM_SUB_TYPE as TLM_SUB,
  SUBSCRIPTION_TYPE,
  NUMBER_RESULTS_BY_PAGE,
  PAGE,
  PopinFixedHeader,
  TracimComponent
} from 'tracim_frontend_lib'
import { escape as escapeHtml } from 'lodash'
import NotificationItem from '../component/NotificationItem.jsx'
import GroupedNotificationItem from './GroupedNotificationItem.jsx'

export class NotificationWall extends React.Component {
  shortDate = date => {
    const { props } = this

    const msElapsed = Date.now() - new Date(date).getTime()
    if (msElapsed < 60000) return Math.round(msElapsed / 1000) + ' ' + props.t('sec')
    if (msElapsed < 3600000) return Math.round(msElapsed / 60000) + ' ' + props.t('min')
    if (msElapsed < 3600000 * 24) return Math.round(msElapsed / 3600000) + ' ' + props.t('hr')
    if (msElapsed < 3600000 * 24 * 7) return Math.round(msElapsed / (3600000 * 24)) + ' ' + props.t('d')
    if (msElapsed < 3600000 * 24 * 30) return Math.round(msElapsed / (3600000 * 24 * 7)) + ' ' + props.t('w')
    if (msElapsed < 3600000 * 24 * 365) return Math.round(msElapsed / (3600000 * 24 * 20)) + ' ' + props.t('mth')
    return Math.round(msElapsed / (3600000 * 24 * 365)) + ' ' + props.t('y')
  }

  handleClickNotification = async (e, notificationId, notificationDetails) => {
    const { props } = this

    if (!notificationDetails.url) {
      if (notificationDetails.emptyUrlMsg) {
        props.dispatch(newFlashMessage(notificationDetails.emptyUrlMsg, notificationDetails.msgType || 'warning'))
      }
      e.preventDefault()
    }

    const fetchPutNotificationAsRead = await props.dispatch(putNotificationAsRead(props.user.userId, notificationId))
    switch (fetchPutNotificationAsRead.status) {
      case 204: {
        props.dispatch(readNotification(notificationId))
        break
      }
      default:
        props.dispatch(newFlashMessage(props.t('Error while marking the notification as read'), 'warning'))
    }

    props.onCloseNotificationWall()
  }

  handleClickSeeMore = async () => {
    const { props } = this

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

  getNotificationDetails = notification => {
    const { props, state } = this

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
        props.t(' in {{numberOfWorkspaces}} spaces', { numberOfWorkspaces: notification.numberOfWorkspaces })
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
              url: this.linkToComment(notification)
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
      return {
        title: props.t('Mention'),
        text: groupMention ? mentionEveryone : mentionYou,
        url: PAGE.CONTENT(notification.content.parentId),
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
    const advancedDashboardUrl = notification.workspace  ? PAGE.WORKSPACE.ADVANCED_DASHBOARD(notification.workspace.id) : ''

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
        case TLM_EVENT.MODIFIED: return {
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

  handleClickMarkAllAsRead = async () => {
    const { props } = this

    const fetchAllPutNotificationAsRead = await props.dispatch(putAllNotificationAsRead(props.user.userId))
    switch (fetchAllPutNotificationAsRead.status) {
      case 204:
        props.dispatch(readNotificationList())
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened while setting "mark all as read"'), 'warning'))
    }
  }

  linkToComment (notification) {
    return PAGE.CONTENT(notification.content.parentId)
  }

  render () {
    const { props } = this

    if (!props.notificationPage.list) return null

    return (
      <div className={classnames('notification', { notification__wallClose: !props.isNotificationWallOpen })}>
        <PopinFixedHeader
          customClass='notification'
          faIcon='far fa-bell'
          rawTitle={props.t('Notifications')}
          componentTitle={<div>{props.t('Notifications')}</div>}
          onClickCloseBtn={props.onCloseNotificationWall}
        >
          <IconButton
            mode='dark'
            onClick={this.handleClickMarkAllAsRead}
            icon='far fa-envelope-open'
            text={props.t('Mark all as read')}
            dataCy='markAllAsReadButton'
          />
        </PopinFixedHeader>

        <div className='notification__list'>
          {props.notificationPage.list.length !== 0 && props.notificationPage.list.map((notification, i) => {
            return (
              <ListItemWrapper
                isLast={i === props.notificationPage.list.length - 1}
                isFirst={i === 0}
                read={false}
                key={notification.id}
              >
                {notification.group
                  ? (
                    <GroupedNotificationItem
                      getNotificationDetails={this.getNotificationDetails}
                      notification={notification}
                      onClickNotification={this.handleClickNotification}
                      shortDate={this.shortDate}
                    />
                  ) : (
                    <NotificationItem
                      getNotificationDetails={this.getNotificationDetails}
                      notification={notification}
                      onClickNotification={this.handleClickNotification}
                      shortDate={this.shortDate}
                      user={props.user}
                    />
                  )}
              </ListItemWrapper>
            )
          })}

          {props.notificationPage.hasNextPage &&
            <div className='notification__footer'>
              <IconButton
                mode='dark'
                onClick={this.handleClickSeeMore}
                icon='fas fa-chevron-down'
                text={props.t('See more')}
              />
            </div>}
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, notificationPage }) => ({ user, notificationPage })
export default connect(mapStateToProps)(translate()(TracimComponent(NotificationWall)))
