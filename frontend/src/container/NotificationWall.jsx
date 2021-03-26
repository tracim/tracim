import React from 'react'
import { Link } from 'react-router-dom'
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
import { FETCH_CONFIG } from '../util/helper.js'
import {
  AVATAR_SIZE,
  CONTENT_TYPE,
  PROFILE,
  displayDistanceDate,
  GenericButton,
  ListItemWrapper,
  PopinFixedHeader,
  TLM_CORE_EVENT_TYPE as TLM_EVENT,
  TLM_ENTITY_TYPE as TLM_ENTITY,
  TLM_SUB_TYPE as TLM_SUB,
  SUBSCRIPTION_TYPE,
  NUMBER_RESULTS_BY_PAGE,
  TracimComponent,
  Avatar,
  ComposedIcon,
  formatAbsoluteDate,
  PAGE
} from 'tracim_frontend_lib'
import { escape as escapeHtml } from 'lodash'

export class NotificationWall extends React.Component {
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
    const { props } = this

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

    const escapedWorkspaceLabel = notification.workspace ? escapeHtml(notification.workspace.label) : ''

    const i18nOpts = {
      user: `<span title='${escapedUser}'>${escapedUser}</span>`,
      author: `<span title='${escapedAuthor}'>${escapedAuthor}</span>`,
      content: `<span title='${escapedContentLabel}' class='contentTitle__highlight'>${escapedContentLabel}</span>`,
      space: `<span title="${escapedWorkspaceLabel}" class='documentTitle__highlight'>${escapedWorkspaceLabel}</span>`,
      interpolation: { escapeValue: false }
    }

    const contentUrl = notification.content ? PAGE.WORKSPACE.CONTENT(notification.workspace.id, notification.content.type, notification.content.id) : ''

    if (entityType === TLM_ENTITY.CONTENT) {
      switch (eventType) {
        case TLM_EVENT.CREATED: {
          if (contentType === TLM_SUB.COMMENT) {
            return {
              icon: 'far fa-comments',
              title: props.t('Comment_noun'),
              text: props.t('{{author}} commented on {{content}} in {{space}}', i18nOpts),
              url: PAGE.WORKSPACE.CONTENT(notification.workspace.id, notification.content.parentContentType, notification.content.parentId)
            }
          }

          return {
            icon: 'fas fa-magic',
            title: props.t('New content'),
            text: props.t('{{author}} created {{content}} in {{space}}', i18nOpts),
            url: contentUrl
          }
        }
        case TLM_EVENT.MODIFIED: {
          if (notification.content.currentRevisionType === 'status-update') {
            return {
              icon: 'fas fa-random',
              title: props.t('Status updated'),
              text: props.t('{{author}} changed the status of {{content}} in {{space}}', i18nOpts),
              url: contentUrl
            }
          }

          return {
            icon: 'fas fa-history',
            title: props.t('Content updated'),
            text: props.t('{{author}} updated {{content}} in {{space}}', i18nOpts),
            url: contentUrl
          }
        }
        case TLM_EVENT.DELETED: {
          return {
            icon: 'fas fa-magic',
            title: props.t('Content deleted'),
            text: props.t('{{author}} deleted {{content}} from {{space}}', i18nOpts),
            url: contentUrl
          }
        }
        case TLM_EVENT.UNDELETED: {
          return {
            icon: 'fas fa-magic',
            title: props.t('Content restored'),
            text: props.t('{{author}} restored {{content}} in {{space}}', i18nOpts),
            url: contentUrl
          }
        }
      }
    }

    if (entityType === TLM_ENTITY.MENTION && eventType === TLM_EVENT.CREATED) {
      if (notification.content.type === CONTENT_TYPE.COMMENT) {
        return {
          icon: 'far fa-comment',
          title: props.t('Mention'),
          text: props.t('{{author}} mentioned you in a comment in {{content}} in {{space}}', i18nOpts),
          url: PAGE.WORKSPACE.CONTENT(notification.workspace.id, notification.content.parentContentType, notification.content.parentId)
        }
      }

      return {
        icon: 'fas fa-at',
        title: props.t('Mention'),
        text: props.t('{{author}} mentioned you in {{content}} in {{space}}', i18nOpts),
        url: contentUrl
      }
    }

    if (entityType === TLM_ENTITY.USER) {
      const details = {
        url: (props.user.profile === PROFILE.administrator.slug) ? PAGE.ADMIN.USER_EDIT(notification.user.userId) : '',
        emptyUrlMsg: props.t("Only an administrator can see this user's account"),
        msgType: 'info'
      }

      switch (eventType) {
        case TLM_EVENT.CREATED: return {
          ...details,
          icon: 'fas fa-user-plus',
          title: props.t('Account created'),
          text: props.t("{{author}} created {{user}}'s account", i18nOpts)
        }
        case TLM_EVENT.MODIFIED: return {
          ...details,
          icon: 'fas fa-user+fas fa-history',
          title: props.t('Account updated'),
          text: props.t("{{author}} modified {{user}}'s account", i18nOpts)
        }
        case TLM_EVENT.DELETED: return {
          ...details,
          icon: 'fas fa-user-times',
          title: props.t('Account deleted'),
          text: props.t("{{author}} deleted {{user}}'s account", i18nOpts)
        }
        case TLM_EVENT.UNDELETED: return {
          ...details,
          icon: 'fas fa-user+fas fa-undo',
          title: props.t('Account restored'),
          text: props.t("{{author}} restored {{user}}'s account", i18nOpts)
        }
      }
    }

    const dashboardUrl = notification.workspace ? PAGE.WORKSPACE.DASHBOARD(notification.workspace.id) : ''

    if (entityType === TLM_ENTITY.SHAREDSPACE_MEMBER) {
      switch (eventType) {
        case TLM_EVENT.CREATED: {
          let notificationText
          if (props.user.userId === notification.user.userId) {
            notificationText = props.t('{{author}} added you to {{space}}', i18nOpts)
          } else {
            if (notification.author.userId === notification.user.userId) {
              notificationText = props.t('{{author}} joined space {{space}}', i18nOpts)
            } else {
              notificationText = props.t('{{author}} added {{user}} to {{space}}', i18nOpts)
            }
          }
          return {
            icon: 'fas fa-user-plus',
            title: props.t('New access'),
            text: notificationText,
            url: dashboardUrl
          }
        }
        case TLM_EVENT.MODIFIED: return {
          icon: 'far fa-user+fas fa-history',
          title: props.t('Status updated'),
          text: props.user.userId === notification.user.userId
            ? props.t('{{author}} modified your role in {{space}}', i18nOpts)
            : props.t("{{author}} modified {{user}}'s role in {{space}}", i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.DELETED: return {
          icon: 'fas fa-user-times',
          title: props.t('Access removed'),
          text: props.user.userId === notification.user.userId
            ? props.t('{{author}} removed you from {{space}}', i18nOpts)
            : props.t('{{author}} removed {{user}} from {{space}}', i18nOpts),
          url: dashboardUrl
        }
      }
    }

    if (entityType === TLM_ENTITY.SHAREDSPACE) {
      switch (eventType) {
        case TLM_EVENT.CREATED: return {
          icon: 'fas fa-users+fas fa-plus',
          title: props.t('New space'),
          text: props.t('{{author}} created the space {{space}}', i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.MODIFIED: return {
          icon: 'fas fa-users+fas fa-history',
          title: props.t('Space updated'),
          text: props.t('{{author}} modified the space {{space}}', i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.DELETED: return {
          icon: 'fas fa-users+fas fa-times',
          title: props.t('Space deleted'),
          text: props.t('{{author}} deleted the space {{space}}', i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.UNDELETED: return {
          icon: 'fas fa-users+fas fa-undo',
          title: props.t('Space restored'),
          text: props.t('{{author}} restored the space {{space}}', i18nOpts),
          url: dashboardUrl
        }
      }
    }

    const defaultEmptyUrlMsg = props.t('This notification has no associated content')

    const subscriptionPageURL = '' // RJ - 2020-10-19 - FIXME: depends on https://github.com/tracim/tracim/issues/3594

    if (entityType === TLM_ENTITY.SHAREDSPACE_SUBSCRIPTION) {
      // INFO - GB - 2020-12-29 - MODIFIED.accepted and DELETED events do not make notifications

      if (props.user.userId === notification.subscription.author.userId) {
        // RJ - 2020-10-19 - NOTE
        // TLM_EVENT.CREATED notifications should not be shown, or even received
        // assuming that the author of a subscription is always the concerned user
        if (eventType === TLM_EVENT.MODIFIED) {
          if (notification.subscription.state === SUBSCRIPTION_TYPE.accepted.slug) return {}
          if (notification.subscription.state === SUBSCRIPTION_TYPE.rejected.slug) {
            return {
              icon: SUBSCRIPTION_TYPE.rejected.faIcon,
              title: props.t('Access removed'),
              text: props.t('{{author}} rejected your access to {{space}}', i18nOpts),
              url: subscriptionPageURL,
              emptyUrlMsg: defaultEmptyUrlMsg
            }
          }
        }
      } else {
        switch (eventType) {
          case TLM_EVENT.CREATED: return {
            icon: SUBSCRIPTION_TYPE.pending.faIcon,
            title: props.t('Requested access'),
            text: props.t('{{author}} requested access to {{space}}', i18nOpts),
            url: dashboardUrl
          }
          case TLM_EVENT.MODIFIED: {
            if (notification.subscription.state === SUBSCRIPTION_TYPE.accepted.slug) return {}
            if (notification.subscription.state === SUBSCRIPTION_TYPE.rejected.slug) {
              return {
                icon: SUBSCRIPTION_TYPE.rejected.faIcon,
                title: props.t('Access removed'),
                text: props.t('{{author}} rejected access to {{space}} for {{user}}', i18nOpts),
                url: defaultEmptyUrlMsg
              }
            }

            if (notification.subscription.state === SUBSCRIPTION_TYPE.pending.slug) {
              return {
                icon: SUBSCRIPTION_TYPE.pending.faIcon,
                title: props.t('Requested access'),
                text: props.t('{{author}} requested access to {{space}}', i18nOpts),
                url: dashboardUrl
              }
            }
          }
        }
      }
    }

    return {
      icon: 'fas fa-bell',
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
          <GenericButton
            customClass='btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
            onClick={this.handleClickMarkAllAsRead}
            label={props.t('Mark all as read')}
            faIcon='far fa-envelope-open'
            dataCy='markAllAsReadButton'
          />
        </PopinFixedHeader>

        <div className='notification__list'>
          {props.notificationPage.list.length !== 0 && props.notificationPage.list.map((notification, i) => {
            const notificationDetails = this.getNotificationDetails(notification)
            if (Object.keys(notificationDetails).length === 0) return
            const icons = notificationDetails.icon.split('+')
            const icon = (
              icons.length === 1
                ? <i title={notificationDetails.title} className={`fa-fw ${icons[0]}`} />
                : <ComposedIcon titleIcon={notificationDetails.title} mainIcon={icons[0]} smallIcon={icons[1]} />
            )

            return (
              <ListItemWrapper
                isLast={i === props.notificationPage.list.length - 1}
                read={false}
                key={notification.id}
              >
                <Link
                  to={notificationDetails.url || '#'}
                  onClick={(e) => this.handleClickNotification(e, notification.id, notificationDetails)}
                  className={
                    classnames('notification__list__item', { itemRead: notification.read })
                  }
                  key={notification.id}
                >
                  <span className='notification__list__item__icon'>{icon}</span>
                  <div className='notification__list__item__text'>
                    <Avatar
                      size={AVATAR_SIZE.MINI}
                      apiUrl={FETCH_CONFIG.apiUrl}
                      user={notification.author}
                      style={{ marginRight: '5px' }}
                    />
                    <span
                      dangerouslySetInnerHTML={{
                        __html: (
                          notificationDetails.text + ' ' +
                          `<span title='${escapeHtml(formatAbsoluteDate(notification.created, props.user.lang))}'>` +
                            escapeHtml(displayDistanceDate(notification.created, props.user.lang)) +
                          '</span>'
                        )
                      }}
                    />
                  </div>
                  {!notification.read && <i className='notification__list__item__circle fas fa-circle' />}
                </Link>
              </ListItemWrapper>
            )
          })}

          {props.notificationPage.hasNextPage &&
            <div className='notification__footer'>
              <GenericButton
                customClass='btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                onClick={this.handleClickSeeMore}
                label={props.t('See more')}
                faIcon='fas fa-chevron-down'
              />
            </div>}
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, notificationPage }) => ({ user, notificationPage })
export default connect(mapStateToProps)(translate()(TracimComponent(NotificationWall)))
