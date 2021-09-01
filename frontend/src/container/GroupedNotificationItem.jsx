import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  FETCH_CONFIG,
  GROUP_NOTIFICATION_CRITERIA
} from '../util/helper.js'
import {
  Avatar,
  AVATAR_SIZE,
  formatAbsoluteDate,
  Icon,
  PAGE,
  TLM_SUB_TYPE as TLM_SUB,
  TracimComponent
} from 'tracim_frontend_lib'
import { updateNotification } from '../action-creator.sync'
import { escape as escapeHtml, uniqBy } from 'lodash'

export class GroupedNotificationItem extends React.Component {
  getGroupedNotificationDetails = notification => {
    const { getNotificationDetails, t } = this.props

    const numberOfContributionTypes = uniqBy(notification.group, 'type').length
    const numberOfWorkspaces = uniqBy(notification.group.map(notification => notification.workspace), 'id').length
    const numberOfContents = uniqBy(notification.group.filter(notification => notification.content)
      .map(notification => {
        return notification.content.type === TLM_SUB.COMMENT
          ? notification.content.parentId
          : notification.content.id
      })).length

    let escapedAuthorList = ''
    if (notification.author) {
      if (notification.author.length === 1) {
        escapedAuthorList = escapeHtml(notification.author[0].publicName)
      } else if (notification.author.length === 2) {
        escapedAuthorList = `${escapeHtml(notification.author[0].publicName)} ${t('and')} ${escapeHtml(notification.author[1].publicName)}`
      } else {
        escapedAuthorList = `${escapeHtml(notification.author[0].publicName)} ${t('and {{numberOfAuthors}} other people', { numberOfAuthors: notification.author.length - 1 })}`
      }
    }

    let escapedContentLabel = ''
    if (notification.group.some(notification => notification.content)) {
      if (numberOfContents > 1) {
        escapedContentLabel = t('{{numberOfContents}} contents', { numberOfContents: numberOfContents })
      } else {
        const content = notification.group.find(notification => notification.content).content
        escapedContentLabel = escapeHtml(content.type === TLM_SUB.COMMENT
          ? content.parentLabel
          : content.label
        )
      }
    }

    const userList = uniqBy(notification.group.map(notification => notification.user), 'userId')
    const escapedUser = userList.length > 1
      ? t('{{numberOfUsers}} user', { numberOfUsers: userList.length })
      : escapeHtml(notification.group[0].user.publicName)

    const i18nOpts = {
      user: `<span title='${escapedUser}'>${escapedUser}</span>`,
      author: `<span title='${escapedAuthorList}'>${escapedAuthorList}</span>`,
      content: `<span title='${escapedContentLabel}' class='contentTitle__highlight'>${escapedContentLabel}</span>`,
      numberOfContribution: notification.group.length,
      numberOfWorkspaces: numberOfWorkspaces,
      interpolation: { escapeValue: false }
    }

    if (numberOfContributionTypes > 1) {
      let contentUrl
      if (numberOfContents === 1) {
        const content = notification.group.find(notification => notification.content).content
        contentUrl = PAGE.CONTENT(content.type === TLM_SUB.COMMENT
          ? content.parentId
          : content.id
        )
      }

      return {
        text: numberOfWorkspaces > 1
          ? t('{{author}} made {{numberOfContribution}} contributions in {{numberOfWorkspaces}} spaces', i18nOpts)
          : numberOfContents === 1
            ? t('{{author}} made {{numberOfContribution}} contributions on {{content}}', i18nOpts)
            : t('{{author}} made {{numberOfContribution}} contributions', i18nOpts),
        url: contentUrl
      }
    } else {
      const notificationDetails = getNotificationDetails({
        ...notification.group[0],
        author: { publicName: escapedAuthorList },
        content: { ...notification.group[0].content, label: escapedContentLabel, parentLabel: escapedContentLabel },
        numberOfWorkspaces: numberOfWorkspaces,
        numberOfContents: numberOfContents,
        type: notification.group[0].type,
        user: { ...notification.group[0].user, publicName: escapedUser }
      })

      if (numberOfContents !== 1) delete notificationDetails.url
      return notificationDetails
    }
  }

  handleClickGroupedNotification = (e, notification) => {
    const { props } = this

    if (notification.type.includes(GROUP_NOTIFICATION_CRITERIA.CONTENT)) {
      notification.group.forEach(notification => props.onClickNotification(e, notification.id, {
        url: PAGE.CONTENT(notification.content.type === TLM_SUB.COMMENT
          ? notification.content.parentId
          : notification.content.id)
      }))
    } else {
      props.dispatch(updateNotification(notification.id, notification.group))
    }
  }

  render () {
    const { props } = this
    const { notification, user } = props
    const notificationDetails = this.getGroupedNotificationDetails(notification)
    if (Object.keys(notificationDetails).length === 0) return null

    const numberOfWorkspaces = uniqBy(notification.group.map(notification => notification.workspace), 'id').length
    const numberOfAuthors = notification.author.length
    const readStatus = notification.group.map(notification => notification.read)
      .reduce((acc, current) => acc && current)

    return (
      <Link
        to={notificationDetails.url || '#'}
        onClick={(e) => this.handleClickGroupedNotification(e, notification)}
        className={classnames('notification__list__item',
          { itemRead: readStatus, isMention: notificationDetails.isMention }
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
            {props.shortDate(notification.group[notification.group.length - 1].created)}
          </div>
          <div className='notification__list__item__meta__space'>
            {(numberOfWorkspaces === 1 && notification.group[0].workspace &&
              notification.group[0].workspace.label
            )}
          </div>
        </div>
        <div className='notification__list__item__circle__wrapper'>
          {!readStatus && <i className='notification__list__item__circle fas fa-circle' />}
        </div>
      </Link>

    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(TracimComponent(GroupedNotificationItem)))

GroupedNotificationItem.propTypes = {
  getNotificationDetails: PropTypes.func.isRequired,
  notification: PropTypes.object.isRequired,
  onClickNotification: PropTypes.func.isRequired,
  shortDate: PropTypes.func.isRequired
}
