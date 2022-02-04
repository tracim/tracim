import React from 'react'
import { Link } from 'react-router-dom'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { FETCH_CONFIG } from '../util/helper.js'
import {
  Avatar,
  AVATAR_SIZE,
  formatAbsoluteDate,
  TracimComponent
} from 'tracim_frontend_lib'
import { escape as escapeHtml } from 'lodash'

const NotificationItem = props => {
  const { notification, user } = props
  const notificationDetails = props.getNotificationDetails(notification)
  if (Object.keys(notificationDetails).length === 0) return null

  return (
    <Link
      to={notificationDetails.url || '#'}
      onClick={(e) => props.onClickNotification(e, notification.id, notificationDetails)}
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
              `<span title='${escapeHtml(formatAbsoluteDate(notification.created, user.lang))}'\\>`
            )
          }}
        />
      </div>
      <div className='notification__list__item__meta'>
        <div
          className='notification__list__item__meta__date'
          title={formatAbsoluteDate(notification.created, user.lang)}
        >
          {props.shortDate(notification.created)}
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
              props.onClickCircle(notification.id)
            }}
          />}
      </div>
    </Link>

  )
}
export default translate()(TracimComponent(NotificationItem))

NotificationItem.propTypes = {
  getNotificationDetails: PropTypes.func.isRequired,
  notification: PropTypes.object.isRequired,
  onClickCircle: PropTypes.func.isRequired,
  onClickNotification: PropTypes.func.isRequired,
  shortDate: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
}
