import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { FETCH_CONFIG } from '../util/helper.js'
import {
  Avatar,
  AVATAR_SIZE,
  formatAbsoluteDate,
  Icon,
  TLM_SUB_TYPE as TLM_SUB,
  TracimComponent
} from 'tracim_frontend_lib'
import { escape as escapeHtml, uniqBy } from 'lodash'

export class GroupedNotificationItem extends React.Component {
  getGroupedNotificationDetails = notification => {
    const { getNotificationDetails, t } = this.props

    let escapedAuthor = ''
    let escapedContentLabel = ''

    if (notification.author) {
      if (notification.author.length === 1) escapedAuthor = escapeHtml(notification.author[0].publicName)
      if (notification.author.length === 2) {
        escapedAuthor = `${escapeHtml(notification.author[0].publicName)} ${t('and')} ${escapeHtml(notification.author[1].publicName)}`
      }
      if (notification.author.length >= 2) {
        escapedAuthor = `${escapeHtml(notification.author[0].publicName)} ${t('and {{numberOfAuthors}} other people', { numberOfAuthors: notification.author.length - 1 })
          }`
      }
    }

    if (notification.type.includes('content')) {
      escapedContentLabel = escapeHtml(notification.group[0].content === TLM_SUB.COMMENT
        ? notification.group[0].content.parentLabel
        : notification.group[0].content.label
      )
    }

    const numberOfContibuitionTypes = uniqBy(notification.group, 'type').length
    const numberOfWorkspaces = uniqBy(notification.group.map(notification => notification.workspace), 'id').length

    const escapedUser = notification.user ? escapeHtml(notification.user.publicName) : ''

    const i18nOpts = {
      user: `<span title='${escapedUser}'>${escapedUser}</span>`,
      author: `<span title='${escapedAuthor}'>${escapedAuthor}</span>`,
      content: `<span title='${escapedContentLabel}' class='contentTitle__highlight'>${escapedContentLabel}</span>`,
      numberOfContibuitionTypes: numberOfContibuitionTypes,
      numberOfWorkspaces: numberOfWorkspaces,
      interpolation: { escapeValue: false }
    }

    if (numberOfContibuitionTypes > 1) {
      return {
        text: numberOfWorkspaces > 1
          ? t('{{author}} made {{numberOfContibuitionTypes}} contributions in {{numberOfWorkspaces}} spaces', i18nOpts)
          : t('{{author}} made {{numberOfContibuitionTypes}} contributions', i18nOpts),
        url: '',
        emptyUrlMsg: '',
        msgType: 'warning'
      }
    } else {
      const userList = uniqBy(notification.group.map(notification => notification.user), 'userId')
      return getNotificationDetails({
        ...notification.group[0],
        author: { publicName: escapedAuthor },
        content: { ...notification.group[0].content, label: escapedContentLabel },
        type: notification.group[0].type,
        user: userList.length > 1
          ? { publicName: t('{{numberOfUsers}} user', { numberOfUsers: userList.length }) }
          : notification.group[0].user
      })
    }
  }

  render () {
    const { props } = this
    const { notification, user } = props
    const notificationDetails = this.getGroupedNotificationDetails(notification)
    if (Object.keys(notificationDetails).length === 0) return null
    const numberOfWorkspaces = uniqBy(notification.group.map(notification => notification.workspace), 'id').length
    const numberOfAuthors = notification.author.length

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
          {numberOfAuthors <= 2
            ? (
              <div className='notification__list__item__text__avatars'>
                <Avatar
                  size={numberOfAuthors === 2 ? AVATAR_SIZE.MINI : AVATAR_SIZE.SMALL}
                  apiUrl={FETCH_CONFIG.apiUrl}
                  user={notification.author[0]}
                />
                {numberOfAuthors === 2 && (
                  <Avatar
                    size={AVATAR_SIZE.MINI}
                    apiUrl={FETCH_CONFIG.apiUrl}
                    user={notification.author[1]}
                    customClass='notification__list__item__text__avatars__second'
                  />
                )}
              </div>
            ) : (
              <Icon
                customClass='notification__list__item__text__usersAvatar'
                icon='fas fa-fw fa-users'
                color='#fdfdfd' // INFO - GB - 2021-08-26 - offWhite color
                title={notification.author.map(author => author.publicName)}
              />
            )}
          <span
            className='notification__list__item__text__content'
            dangerouslySetInnerHTML={{
              __html: (
                notificationDetails.text + ' ' +
                `<span title='${escapeHtml(formatAbsoluteDate(notification.created, user.lang))}'>` +
                '</span>'
              )
            }}
          />
        </div>
        <div className='notification__list__item__meta'>
          <div
            className='notification__list__item__meta__date'
            title={formatAbsoluteDate(notification.created, user.lang)}
          >
            {props.shortDate(notification.group[notification.group.length - 1].created)}
          </div>
          <div className='notification__list__item__meta__space'>
            {(numberOfWorkspaces === 1 && notification.group[0].workspace &&
              notification.group[0].workspace.label
            )}
          </div>
        </div>
        <div className='notification__list__item__circle__wrapper'>
          {!notification.read && <i className='notification__list__item__circle fas fa-circle' />}
        </div>
      </Link>

    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(TracimComponent(GroupedNotificationItem)))
