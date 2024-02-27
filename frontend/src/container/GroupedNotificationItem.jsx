import React, { useState } from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import {
  PAGE,
  TLM_SUB_TYPE as TLM_SUB,
  ListItemWrapper,
  TracimComponent
} from 'tracim_frontend_lib'
import NotificationItem from '../component/NotificationItem.jsx'
import GroupRender from '../component/GroupedNotificationItem/GroupRender.jsx'
import { escape as escapeHtml, uniqBy } from 'lodash'
import { isPatternIncludedInString } from './NotificationWall.jsx'

export const GroupedNotificationItem = props => {
  const [isGrouped, setIsGrouped] = useState(true)

  const getGroupedNotificationDetails = (notification) => {
    let hasToDo = false
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
        escapedAuthorList = `${escapeHtml(notification.author[0].publicName)} ${props.t('and {{count}} other people', { count: notification.author.length - 1 })}`
      }
    }

    let escapedContentLabel = ''
    let escapedToDoLabel = ''
    if (notification.group.some(notification => notification.content)) {
      if (numberOfContents > 1) {
        const contentNotification = notification.group.find(notification => notification.content && notification.content.parentId)
        const parentId = contentNotification ? contentNotification.content.parentId : undefined
        const hasDifferentParent = notification.group.some(notification => notification.content && notification.content.parentId !== parentId)
        if (parentId === undefined || hasDifferentParent) {
          escapedContentLabel = props.t('{{numberOfContents}} contents', { numberOfContents: numberOfContents })
        } else {
          const parentLabel = notification.group.find(notification => notification.content).content.parentLabel
          escapedContentLabel = props.t('{{parentLabel}}', {
            parentLabel: parentLabel,
            interpolation: { escapeValue: false }
          })
          escapedToDoLabel = props.t('{{count}} task', {
            count: numberOfContents,
            interpolation: { escapeValue: false }
          })
          hasToDo = true
        }
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

    if (numberOfContributionTypes > 1) {
      let contentUrl
      if (numberOfContents === 1) {
        const content = notification.group.find(notification => notification.content).content
        contentUrl = PAGE.CONTENT(content.type === TLM_SUB.COMMENT
          ? content.parentId
          : content.id
        )
      }

      let text = props.t('{{author}} made {{count}} contributions', {
        author: `<span title='${escapedAuthorList}'>${escapedAuthorList}</span>`,
        count: notification.group.length,
        interpolation: { escapeValue: false }
      })

      if (numberOfWorkspaces > 1) text = text + props.t(' in {{count}} spaces', { count: numberOfWorkspaces, interpolation: { escapeValue: false } })
      else if (numberOfContents === 1) {
        text = text + props.t(' on {{content}}', {
          content: `<span title='${escapedContentLabel}' class='contentTitle__highlight'>${escapedContentLabel}</span>`,
          interpolation: { escapeValue: false }
        })
      }

      return { text, url: contentUrl }
    } else {
      const notificationDetails = props.getNotificationDetails({
        ...notification.group[0],
        author: { publicName: escapedAuthorList },
        content: {
          ...notification.group[0].content,
          hasToDo: hasToDo,
          label: escapedContentLabel,
          parentLabel: escapedContentLabel,
          toDoLabel: escapedToDoLabel
        },
        numberOfContents: numberOfContents,
        numberOfWorkspaces: numberOfWorkspaces,
        type: notification.group[0].type,
        user: { ...notification.group[0].user, publicName: escapedUser }
      })

      if (numberOfContents !== 1) delete notificationDetails.url
      return notificationDetails
    }
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

  if (isGrouped) {
    if (props.filterInput !== '') {
      const groupHaystack = new DOMParser().parseFromString(notificationDetails.text, 'text/html')
      const isMatchGroupNotification = isPatternIncludedInString(
        groupHaystack.body.textContent, props.filterInput
      )

      if (isMatchGroupNotification === false) {
        const isAnyMatchInGroupedNotification = props.groupedNotifications.group.some(n => {
          const haystack = [
            n.author?.publicName || '',
            n.content?.label || '',
            n.workspace?.label || ''
          ].join(' ')
          return isPatternIncludedInString(haystack, props.filterInput)
        })
        if (isAnyMatchInGroupedNotification === false) return null
      }
    }

    return (
      <ListItemWrapper
        isLast={props.isLast}
        isFirst={props.isFirst}
        read={props.read}
      >
        <GroupRender
          groupedNotifications={props.groupedNotifications}
          notificationDetails={notificationDetails}
          handleClickGroupedNotification={handleClickGroupedNotification}
        />
      </ListItemWrapper>
    )
  }

  return props.groupedNotifications.group.map((notification, i) => (
    <ListItemWrapper
      isLast={props.isLast && i === props.groupedNotifications.group.length - 1}
      isFirst={props.isFirst && i === 0}
      read={props.read}
      key={notification.id}
    >
      <NotificationItem
        onCloseNotificationWall={props.onCloseNotificationWall}
        getNotificationDetails={props.getNotificationDetails}
        notification={notification}
        filterInput={props.filterInput}
      />
    </ListItemWrapper>
  ))
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(TracimComponent(GroupedNotificationItem)))

GroupedNotificationItem.propTypes = {
  getNotificationDetails: PropTypes.func.isRequired,
  groupedNotifications: PropTypes.object.isRequired,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
  onCloseNotificationWall: PropTypes.func.isRequired,
  read: PropTypes.bool,
  filterInput: PropTypes.string
}

GroupedNotificationItem.defaultProps = {
  isFirst: false,
  isLast: false,
  read: false,
  filterInput: ''
}
