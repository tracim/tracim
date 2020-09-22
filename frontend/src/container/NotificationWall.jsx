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
import {
  CONTENT_TYPE,
  PROFILE,
  displayDistanceDate,
  GenericButton,
  ListItemWrapper,
  PopinFixedHeader,
  TLM_CORE_EVENT_TYPE as TLM_EVENT,
  TLM_ENTITY_TYPE as TLM_ENTITY,
  TLM_SUB_TYPE as TLM_SUB,
  TracimComponent,
  Avatar,
  ComposedIcon,
  formatAbsoluteDate
} from 'tracim_frontend_lib'
import {
  ANCHOR_NAMESPACE,
  NUMBER_RESULTS_BY_PAGE
} from '../util/helper.js'

import { escape as escapeHtml } from 'lodash'

export class NotificationWall extends React.Component {
  handleClickNotification = async notificationId => {
    const { props } = this

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

    const fetchGetNotificationWall = await props.dispatch(getNotificationList(props.user.userId, NUMBER_RESULTS_BY_PAGE, props.notificationPage.nextPageToken))
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

    const escapedAuthor = escapeHtml(notification.author)
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
      content: `<span title='${escapedContentLabel}'class='contentTitle__highlight'>${escapedContentLabel}</span>`,
      workspace: `<span title="${escapedWorkspaceLabel}" class='documentTitle__highlight'>${escapedWorkspaceLabel}</span>`,
      interpolation: { escapeValue: false }
    }

    if (entityType === TLM_ENTITY.CONTENT) {
      if (eventType === TLM_EVENT.created && contentType === TLM_SUB.COMMENT) {
        return {
          icon: 'comments-o',
          text: props.t('{{author}} commented on {{content}} in {{workspace}}', i18nOpts),
          url: `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.parentContentType}/${notification.content.parentId}`
        }
      }

      const url = `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.type}/${notification.content.id}`

      switch (eventType) {
        case TLM_EVENT.CREATED: {
          return {
            icon: 'magic',
            text: props.t('{{author}} created {{content}} in {{workspace}}', i18nOpts),
            url: `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.type}/${notification.content.id}`
          }
        }
        case TLM_EVENT.MODIFIED: {
          if (notification.content.currentRevisionType === 'status-update') {
            return {
              icon: 'random',
              text: props.t('{{author}} changed the status of {{content}} in {{workspace}}', i18nOpts),
              url: url
            }
          }

          return {
            icon: 'history',
            text: props.t('{{author}} updated {{content}} in {{workspace}}', i18nOpts),
            url: url
          }
        }
        case TLM_EVENT.DELETED: {
          return {
            icon: 'magic',
            text: props.t('{{author}} deleted {{content}} from {{workspace}}', i18nOpts),
            url: `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.type}/${notification.content.id}`
          }
        }
        case TLM_EVENT.UNDELETED: {
          return {
            icon: 'magic',
            text: props.t('{{author}} restored {{content}} in {{workspace}}', i18nOpts),
            url: `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.type}/${notification.content.id}`
          }
        }
      }
    }

    if (entityType === TLM_ENTITY.SHAREDSPACE_MEMBER) {
      switch (eventType) {
        case TLM_EVENT.CREATED: return {
          icon: 'user-o+plus',
          text: props.user.userId === notification.user.userId
            ? props.t('{{author}} added you to {{workspace}}', i18nOpts)
            : props.t('{{author}} added {{user}} to {{workspace}}', i18nOpts),
          url: `/ui/workspaces/${notification.workspace.id}/dashboard`
        }
        case TLM_EVENT.MODIFIED: return {
          icon: 'user-o+history',
          text: props.user.userId === notification.user.userId
            ? props.t('{{author}} added you to {{workspace}}', i18nOpts)
            : props.t('{{author}} added {{user}} to {{workspace}}', i18nOpts),
          url: `/ui/workspaces/${notification.workspace.id}/dashboard`
        }
        case TLM_EVENT.DELETED: return {
          icon: 'user-o+times',
          text: props.user.userId === notification.user.userId
            ? props.t('{{author}} added you to {{workspace}}', i18nOpts)
            : props.t('{{author}} added {{user}} to {{workspace}}', i18nOpts),
          url: `/ui/workspaces/${notification.workspace.id}/dashboard`
        }
      }
    }

    if (entityType === TLM_ENTITY.MENTION && eventType === TLM_EVENT.CREATED) {
      if (notification.content.type === CONTENT_TYPE.COMMENT) {
        return {
          icon: 'comment-o',
          text: props.t('{{author}} mentioned you in a comment in {{content}} in {{workspace}}', i18nOpts),
          url: `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.parentContentType}/${notification.content.parentId}`
        }
      }

      return {
        icon: 'at',
        text: props.t('{{author}} mentioned you in {{content}} in {{workspace}}', i18nOpts),
        url: `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.type}/${notification.content.id}`
      }
    }

    if (entityType === TLM_ENTITY.USER) {
      const url = (props.user.profile === PROFILE.administrator.slug) ? `/ui/admin/user/${notification.user.userId}` : ''

      switch (eventType) {
        case TLM_EVENT.CREATED: return {
          icon: 'user-plus',
          text: props.t("{{author}} created {{user}}'s profile", i18nOpts),
          url: url
        }
        case TLM_EVENT.MODIFIED: return {
          icon: 'user+history',
          text: props.t("{{author}} modified {{user}}'s profile", i18nOpts),
          url: url
        }
        case TLM_EVENT.DELETED: return {
          icon: 'user-times',
          text: props.t("{{author}} deleted {{user}}'s profile", i18nOpts),
          url: url
        }
        case TLM_EVENT.UNDELETED: return {
          icon: 'user+undo',
          text: props.t("{{author}} restored {{user}}'s profile", i18nOpts),
          url: url
        }
      }
    }

    if (entityType === TLM_ENTITY.WORKSPACE) {
      const url = `/ui/workspaces/${notification.workspace.id}/dashboard`

      switch (eventType) {
        case TLM_EVENT.CREATED: return {
          icon: 'university+plus',
          text: props.t('{{author}} created the space {{space}}'),
          url: url
        }
        case TLM_EVENT.MODIFIED: return {
          icon: 'university+history',
          text: props.t('{{author}} modified the space {{space}}'),
          url: url
        }
        case TLM_EVENT.DELETED: return {
          icon: 'university+times',
          text: props.t('{{author}} deleted the space {{space}}'),
          url: url
        }
        case TLM_EVENT.UNDELETED: return {
          icon: 'university+undo',
          text: props.t('{{author}} restored the space {{space}}'),
          url: url
        }
      }
    }

    return null

    // RJ - 2020-09-21 - NOTE: we don't want to show unhandled notifications to the user
    // return {
    //   icon: 'bell',
    //   text: `${notification.author} ${notification.type}`,
    //   url: notification.content
    //     ? `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.type}/${notification.content.id}`
    //     : ''
    // }
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

    const detailledNotifications = props.notificationPage.list.reduce((res, notification) => {
      const details = this.getNotificationDetails(notification)
      if (details) {
        res.push({ notification, details })
      }
      return res
    }, [])

    return (
      <div className={classnames('notification', { notification__wallClose: !props.isNotificationWallOpen })}>
        <PopinFixedHeader
          customClass='notification'
          faIcon='bell-o'
          rawTitle={props.t('Notifications')}
          componentTitle={<div>{props.t('Notifications')}</div>}
          onClickCloseBtn={props.onCloseNotificationWall}
        >
          <GenericButton
            customClass='btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
            onClick={this.handleClickMarkAllAsRead}
            label={props.t('Mark all as read')}
            faIcon='envelope-open-o'
            dataCy='markAllAsReadButton'
          />
        </PopinFixedHeader>

        <div className='notification__list'>
          {detailledNotifications.map((detailledNotification, i) => {
            const { notification, details } = detailledNotification
            const icons = details.icon.split('+')
            const icon = (
              icons.length === 1
                ? <i className={`fa fa-fw fa-${icons[0]}`} />
                : <ComposedIcon mainIcon={icons[0]} smallIcon={icons[1]} />
            )

            return (
              <ListItemWrapper
                isLast={i === props.notificationPage.list.length - 1}
                read={false}
                id={`${ANCHOR_NAMESPACE.contentItem}:${notification.id}`}
                key={notification.id}
              >
                <Link
                  to={details.url}
                  onClick={() => this.handleClickNotification(notification.id)}
                  className={
                    classnames('notification__list__item', { itemRead: notification.read })
                  }
                  key={notification.id}
                >
                  {icon}
                  <div className='notification__list__item__text'>
                    <Avatar publicName={notification.author} width={23} style={{ marginRight: '5px' }} />
                    <span
                      dangerouslySetInnerHTML={{
                        __html: (
                          details.text + ' ' +
                          `<span title='${escapeHtml(formatAbsoluteDate(notification.created, props.user.lang))}'>` +
                            escapeHtml(displayDistanceDate(notification.created, props.user.lang)) +
                          '</span>'
                        )
                      }}
                    />
                  </div>
                  {!notification.read && <i className='notification__list__item__circle fa circle' />}
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
                faIcon='chevron-down'
              />
            </div>}
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, notificationPage }) => ({ user, notificationPage })
export default connect(mapStateToProps)(translate()(TracimComponent(NotificationWall)))
