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
  buildTracimLiveMessageEventType,
  CONTENT_TYPE,
  displayDistanceDate,
  GenericButton,
  ListItemWrapper,
  PopinFixedHeader,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent,
  Avatar,
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
    let icon, text, url

    const escapedAuthor = escapeHtml(notification.author)

    const escapedContentLabel = (
      notification.content
        ? escapeHtml(
          notification.type === buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT)
            ? notification.content.parentLabel
            : notification.content.label
        )
        : ''
    )

    const escapedWorkspaceLabel = notification.workspace ? escapeHtml(notification.workspace.label) : ''

    const i18nOpts = {
      author: `<span title='${escapedAuthor}'>${escapedAuthor}</span>`,
      content: `<span title='${escapedContentLabel}'class='contentTitle__highlight'>${escapedContentLabel}</span>`,
      workspace: `<span title="${escapedWorkspaceLabel}" class='documentTitle__highlight'>${escapedWorkspaceLabel}</span>`,
      interpolation: { escapeValue: false }
    }

    switch (notification.type) {
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT):
        icon = 'fa-comments-o'
        text = props.t('{{author}} commented on {{content}} in {{workspace}}', i18nOpts)
        url = `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.parentContentType}/${notification.content.parentId}`
        break
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.HTML_DOCUMENT):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.FILE):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.FOLDER):
        icon = 'fa-magic'
        text = props.t('{{author}} created {{content}} in {{workspace}}', i18nOpts)
        url = `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.type}/${notification.content.id}`
        break
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.HTML_DOCUMENT):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FILE):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FOLDER):
        if (notification.content.currentRevisionType === 'status-update') {
          icon = 'fa-random'
          text = props.t('{{author}} updated the status of {{content}} in {{workspace}}', i18nOpts)
        } else {
          icon = 'fa-history'
          text = props.t('{{author}} updated a new version of {{content}} in {{workspace}}', i18nOpts)
        }
        url = `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.type}/${notification.content.id}`
        break
      case buildTracimLiveMessageEventType(TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED):
        icon = 'fa-user-o'
        text = props.user.userId === notification.user.userId
          ? props.t('{{author}} added you to {{workspace}}', i18nOpts)
          : props.t('{{author}} added {{user}} to {{workspace}}', i18nOpts)
        url = `/ui/workspaces/${notification.workspace.id}/dashboard`
        break
      case buildTracimLiveMessageEventType(TLM_ET.MENTION, TLM_CET.CREATED):
        if (notification.content.type === CONTENT_TYPE.COMMENT) {
          icon = 'fa-comment-o'
          text = props.t('{{author}} mentioned you in a comment in {{content}} in {{workspace}}', i18nOpts)
          url = `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.parentContentType}/${notification.content.parentId}`
        } else {
          icon = 'fa-at'
          text = props.t('{{author}} mentioned you in {{content}} in {{workspace}}', i18nOpts)
          url = `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.type}/${notification.content.id}`
        }
        break
      default:
        icon = 'fa-bell'
        text = `${notification.author} ${notification.type}`
        url = notification.content
          ? `/ui/workspaces/${notification.workspace.id}/contents/${notification.content.type}/${notification.content.id}`
          : '/ui'
    }
    return { icon, text, url }
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
          {props.notificationPage.list.length !== 0 && props.notificationPage.list.map((notification, i) => {
            const notificationDetails = this.getNotificationDetails(notification)

            return (
              <ListItemWrapper
                isLast={i === props.notificationPage.list.length - 1}
                read={false}
                id={`${ANCHOR_NAMESPACE.contentItem}:${notification.id}`}
                key={notification.id}
              >
                <Link
                  to={notificationDetails.url}
                  onClick={() => this.handleClickNotification(notification.id)}
                  className={
                    classnames('notification__list__item', { itemRead: notification.read })
                  }
                  key={notification.id}
                >
                  <i className={`notification__list__item__icon fa ${notificationDetails.icon}`} />
                  <div className='notification__list__item__text'>
                    <Avatar publicName={notification.author} width={23} style={{ marginRight: '5px' }} />
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
                  {!notification.read && <i className='notification__list__item__circle fa fa-circle' />}
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
