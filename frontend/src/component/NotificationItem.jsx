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
  newFlashMessage
} from '../action-creator.sync.js'
import {
  AVATAR_SIZE,
  Avatar,
  formatAbsoluteDate,
  isPatternIncludedInString
} from 'tracim_frontend_lib'
import { escape as escapeHtml } from 'lodash'

export const NotificationItem = props => {
  const { notification, user } = props

  const notificationDetails = props.getNotificationDetails(notification)

  if (props.filterInput !== '') {
    const haystack = new DOMParser().parseFromString(notificationDetails.text, 'text/html')
    if (
      !isPatternIncludedInString(haystack.body.textContent, props.filterInput) &&
      !isPatternIncludedInString(notification.workspace?.label, props.filterInput)
    ) return null
  }

  const handleClickNotification = async (e, notification, notificationDetails) => {
    if (!notificationDetails.url) {
      if (notificationDetails.emptyUrlMsg) {
        props.dispatch(newFlashMessage(notificationDetails.emptyUrlMsg, notificationDetails.msgType || 'warning'))
      }
      e.preventDefault()
    }

    props.onClickMarkNotificationListAsRead([notification])

    props.onCloseNotificationWall()
  }

  if (Object.keys(notificationDetails).length === 0) return null

  return (
    <Link
      to={notificationDetails.url || '#'}
      onClick={(e) => handleClickNotification(e, notification, notificationDetails)}
      className={classnames('notification__list__item',
        { itemRead: notification.read, isMention: notificationDetails.isMention, isToDo: notificationDetails.isToDo }
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
      <div
        className='notification__list__item__circle__wrapper'
        title={props.t('Mark as read')}
      >
        {!notification.read && (
          <i
            className='notification__list__item__circle fas fa-circle'
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              props.onClickMarkNotificationListAsRead([notification])
            }}
          />
        )}
      </div>
    </Link>

  )
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(NotificationItem))

NotificationItem.propTypes = {
  getNotificationDetails: PropTypes.func.isRequired,
  notification: PropTypes.object.isRequired,
  onCloseNotificationWall: PropTypes.func.isRequired,
  onClickMarkNotificationListAsRead: PropTypes.func.isRequired,
  filterInput: PropTypes.string
}

NotificationItem.defaultProps = {
  filterInput: ''
}
