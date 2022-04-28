import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  FETCH_CONFIG,
  computeShortDate
} from '../util/helper.js'
import {
  putNotificationAsRead
} from '../action-creator.async.js'
import {
  newFlashMessage,
  readNotification
} from '../action-creator.sync.js'
import {
  AVATAR_SIZE,
  Avatar,
  TracimComponent,
  formatAbsoluteDate
} from 'tracim_frontend_lib'
import { escape as escapeHtml } from 'lodash'

export const NotificationItem = props => {
  const { notification, user } = props
  const notificationDetails = props.getNotificationDetails(notification)

  const handleClickNotification = async (e, notificationId, notificationDetails) => {
    if (!notificationDetails.url) {
      if (notificationDetails.emptyUrlMsg) {
        props.dispatch(newFlashMessage(notificationDetails.emptyUrlMsg, notificationDetails.msgType || 'warning'))
      }
      e.preventDefault()
    }

    handleReadNotification(notificationId)

    props.onCloseNotificationWall()
  }

  const handleReadNotification = async (notificationId) => {
    const fetchPutNotificationAsRead = await props.dispatch(putNotificationAsRead(props.user.userId, notificationId))
    switch (fetchPutNotificationAsRead.status) {
      case 204: {
        props.dispatch(readNotification(notificationId))
        break
      }
      default:
        props.dispatch(newFlashMessage(props.t('Error while marking the notification as read'), 'warning'))
    }
  }

  if (Object.keys(notificationDetails).length === 0) return null

  return (
    <Link
      to={notificationDetails.url || '#'}
      onClick={(e) => handleClickNotification(e, notification.id, notificationDetails)}
      className={classnames('notification__list__item',
        { itemRead: notification.read, isMention: notificationDetails.isMention }
      )}
      key={notification.id}
    >
      <div className='notification__list__item__text'>
        <Avatar
          size={AVATAR_SIZE.SMALL}
          apiUrl={FETCH_CONFIG.apiUrl}
          user={notification.author}
        />
        <span
          className='notification__list__item__text__content'
          dangerouslySetInnerHTML={{
            __html: (
              notificationDetails.text + ' ' +
              `<span title='${escapeHtml(formatAbsoluteDate(notification.created, user.lang))}'></span>`
            )
          }}
        />
      </div>
      <div className='notification__list__item__meta'>
        <div
          className='notification__list__item__meta__date'
          title={formatAbsoluteDate(notification.created, user.lang)}
        >
          {computeShortDate(props.notification.created, props.t)}
        </div>
        <div className='notification__list__item__meta__space'>
          {(notification.workspace &&
            notification.workspace.label
          )}
        </div>
      </div>
      <div className='notification__list__item__circle__wrapper'>
        {!notification.read &&
          <i
            className='notification__list__item__circle fas fa-circle'
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              handleReadNotification(notification.id)
            }}
          />}
      </div>
    </Link>

  )
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(TracimComponent(NotificationItem)))

NotificationItem.propTypes = {
  onCloseNotificationWall: PropTypes.func.isRequired,
  getNotificationDetails: PropTypes.func.isRequired,
  notification: PropTypes.object.isRequired
}
