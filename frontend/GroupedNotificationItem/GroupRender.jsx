import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  FETCH_CONFIG,
  computeShortDate
} from '../src/util/helper.js'
import {
  AVATAR_SIZE,
  Avatar,
  Icon,
  formatAbsoluteDate
} from 'tracim_frontend_lib'
import { escape as escapeHtml, uniqBy } from 'lodash'

const GroupRender = props => {
  const {
    groupedNotifications,
    notificationDetails,
    handleClickGroupedNotification,
    user,
    t
  } = props

  const numberOfAuthors = groupedNotifications.author.length
  const numberOfWorkspaces = uniqBy(groupedNotifications.group.map(notification => notification.workspace), 'id').length
  const readStatus = groupedNotifications.group.map(notification => notification.read).reduce((acc, current) => acc && current)

  // FIXME - MP - 14-03-2022 - Function removed so I can safely push
  // However this is a regression, we can't put a group notification as read
  // Issue : https://github.com/tracim/tracim/issues/5526
  const handleReadGroupNotification = async (groupNotification) => {
    //   // TODO - MP - 14-03-2022
    //   // Create a props.dispatch(putGroupNotificationsAsRead(props.user.userId, groupNotification.group))
    //   // Where it will read every notification in groupNotification.group
    //   // related to https://github.com/tracim/tracim/issues/5526
    //
    //   const fetchPutNotificationAsRead = { status = 404 }
    //   switch (fetchPutNotificationAsRead.status) {
    //     case 204: {
    //       props.dispatch(readGroupNotification(notificationId))
    //       break
    //     }
    //     default:
    //       props.dispatch(newFlashMessage(props.t('Error while marking the notification as read'), 'warning'))
    //   }
  }

  return (
    <Link
      to={notificationDetails.url || '#'}
      onClick={handleClickGroupedNotification}
      className={classnames('notification__list__item',
        { itemRead: readStatus, isMention: notificationDetails.isMention }
      )}
      key={groupedNotifications.id}
    >
      <div className='notification__list__item__text'>
        {numberOfAuthors <= 2
          ? (
            <div className='notification__list__item__text__avatars'>
              <Avatar
                size={numberOfAuthors === 2 ? AVATAR_SIZE.MINI : AVATAR_SIZE.SMALL}
                apiUrl={FETCH_CONFIG.apiUrl}
                user={groupedNotifications.author[0]}
              />
              {numberOfAuthors === 2 && (
                <Avatar
                  size={AVATAR_SIZE.MINI}
                  apiUrl={FETCH_CONFIG.apiUrl}
                  user={groupedNotifications.author[1]}
                  customClass='notification__list__item__text__avatars__second'
                />
              )}
            </div>
          ) : (
            <Icon
              customClass='notification__list__item__text__usersAvatar'
              icon='fas fa-fw fa-users'
              color='#fdfdfd' // INFO - GB - 2021-08-26 - offWhite color
              title={groupedNotifications.author.map(author => author.publicName)}
            />
          )}
        <span
          className='notification__list__item__text__content'
          dangerouslySetInnerHTML={{
            __html: (
              notificationDetails.text + ' ' +
              `<span title='${escapeHtml(formatAbsoluteDate(groupedNotifications.created, user.lang))}'></span>`
            )
          }}
        />
      </div>
      <div className='notification__list__item__meta'>
        <div
          className='notification__list__item__meta__date'
          title={formatAbsoluteDate(groupedNotifications.created, user.lang)}
        >
          {computeShortDate(groupedNotifications.created, t)}
        </div>
        <div className='notification__list__item__meta__space'>
          {(numberOfWorkspaces === 1 && groupedNotifications.group[0].workspace &&
            groupedNotifications.group[0].workspace.label
          )}
        </div>
      </div>
      <div className='notification__list__item__circle__wrapper'>
        {!readStatus &&
          <i
            className='notification__list__item__circle fas fa-circle'
            onClick={() => handleReadGroupNotification(groupedNotifications)}
          />}
      </div>
    </Link>
  )
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(GroupRender))

GroupRender.propTypes = {
  groupedNotifications: PropTypes.object.isRequired,
  handleClickGroupedNotification: PropTypes.func.isRequired,
  notificationDetails: PropTypes.object.isRequired
}
