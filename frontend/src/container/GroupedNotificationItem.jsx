import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  PAGE,
  TLM_SUB_TYPE as TLM_SUB,
  TracimComponent
} from 'tracim_frontend_lib'
import NotificationItem from '../component/NotificationItem.jsx'
import GroupRender from '../../GroupedNotificationItem/GroupRender.jsx'
// import putNotificationAsRead from '../action-creator.async.js'
import { escape as escapeHtml, uniqBy } from 'lodash'

export const GroupedNotificationItem = props => {
  const [notificationList, setNotificationList] = useState([])
  const [isGrouped, setIsGrouped] = useState(true)

  useEffect(() => {
    const tmpNotificationList = []
    props.groupedNotifications.group.forEach(notification => {
      tmpNotificationList.push(notification)
    })
    setNotificationList(tmpNotificationList)
  }, [props.groupedNotifications])

  const getGroupedNotificationDetails = (notification) => {
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
        escapedAuthorList = `${escapeHtml(notification.author[0].publicName)} ${props.t('and')} ${escapeHtml(notification.author[1].publicName)}`
      } else {
        escapedAuthorList = `${escapeHtml(notification.author[0].publicName)} ${props.t('and {{numberOfAuthors}} other people', { numberOfAuthors: notification.author.length - 1 })}`
      }
    }

    let escapedContentLabel = ''
    if (notification.group.some(notification => notification.content)) {
      if (numberOfContents > 1) {
        escapedContentLabel = props.t('{{numberOfContents}} contents', { numberOfContents: numberOfContents })
      } else {
        const content = notification.group.find(notification => notification.content).content
        escapedContentLabel = escapeHtml(content.type === TLM_SUB.COMMENT
          ? content.parentLabel
          : content.label
        )
      }
    }

    const userList = uniqBy(notification.group.map(notification => notification.user), 'userId')
    const escapedUser = userList.length === 1 && userList[0]
      ? escapeHtml(userList[0].publicName)
      : props.t('{{numberOfUsers}} users', { numberOfUsers: userList.length })

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
          ? props.t('{{author}} made {{numberOfContribution}} contributions in {{numberOfWorkspaces}} spaces', i18nOpts)
          : numberOfContents === 1
            ? props.t('{{author}} made {{numberOfContribution}} contributions on {{content}}', i18nOpts)
            : props.t('{{author}} made {{numberOfContribution}} contributions', i18nOpts),
        url: contentUrl
      }
    } else {
      const notificationDetails = props.getNotificationDetails({
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

  const handleClickGroupedNotification = () => {
    // NOTE - MP - 14-03-2022 - Since we redirect to the content if this is a group about a content
    // we close the wall, then we ungroup the group
    if (notificationDetails.url) {
      props.onCloseNotificationWall()
    }
    setIsGrouped(false)
  }

  const notificationDetails = getGroupedNotificationDetails(props.groupedNotifications)
  if (Object.keys(notificationDetails).length === 0) return null

  const listRender =
    notificationList.map((notification) => {
      return (
        <NotificationItem
          onCloseNotificationWall={props.onCloseNotificationWall}
          getNotificationDetails={props.getNotificationDetails}
          key={notification.id}
          notification={notification}
        />
      )
    })

  return isGrouped
    ? (
      <GroupRender
        groupedNotifications={props.groupedNotifications}
        notificationDetails={notificationDetails}
        handleClickGroupedNotification={handleClickGroupedNotification}
        readStatus={props.groupedNotifications.group.map(notification => notification.read).reduce((acc, current) => acc && current)}
        numberOfAuthors={props.groupedNotifications.author.length}
        numberOfWorkspaces={uniqBy(props.groupedNotifications.group.map(notification => notification.workspace), 'id').length}
        handleReadGroupNotification={handleReadGroupNotification}
      />
    )
    : listRender
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(TracimComponent(GroupedNotificationItem)))

GroupedNotificationItem.propTypes = {
  onCloseNotificationWall: PropTypes.func.isRequired,
  getNotificationDetails: PropTypes.func.isRequired,
  groupedNotifications: PropTypes.object.isRequired
}
