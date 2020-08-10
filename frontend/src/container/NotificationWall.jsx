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
  setNextPage,
  updateNotification
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
  TracimComponent
} from 'tracim_frontend_lib'
import { NUMBER_RESULTS_BY_PAGE } from '../util/helper.js'

export class NotificationWall extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isNotificationWallOpen: false
    }
  }

  handleCloseNotificationWall = () => {
    this.setState({ isNotificationWallOpen: false })
  }

  handleClickNotification = async notificationId => {
    const { props } = this

    const fetchPutNotificationAsRead = await props.dispatch(putNotificationAsRead(props.user.userId, notificationId))
    switch (fetchPutNotificationAsRead.status) {
      case 204: {
        const notification = props.notificationPage.list.find(notification => notification.id === notificationId)
        props.dispatch(updateNotification({ ...notification, read: true }))
        break
      }
      default:
        props.dispatch(newFlashMessage(props.t('Error while marking the notification as read'), 'warning'))
    }

    this.handleCloseNotificationWall()
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

    switch (notification.type) {
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT):
        icon = 'fa-comments-o'
        text = props.t('{{author}} commented on {{content}} at {{workspace}}', {
          author: notification.author,
          content: `<span class='contentTitle__highlight'>${notification.content.label}</span>`,
          workspace: `<span class='documentTitle__highlight'>${notification.workspace.label}</span>`,
          interpolation: { escapeValue: false }
        })
        url = `/ui/workspaces/${notification.workspace.workspace_id}/contents/${notification.content.parent_content_type}/${notification.content.content_id}`
        break
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.HTML_DOCUMENT):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.FILE):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.FOLDER):
        icon = 'fa-magic'
        text = props.t('{{author}} created {{content}} at {{workspace}}', {
          author: notification.author,
          content: `<span class='contentTitle__highlight'>${notification.content.label}</span>`,
          workspace: `<span class='documentTitle__highlight'>${notification.workspace.label}</span>`,
          interpolation: { escapeValue: false }
        })
        url = `/ui/workspaces/${notification.workspace.workspace_id}/contents/${notification.content.content_type}/${notification.content.content_id}`
        break
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.HTML_DOCUMENT):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FILE):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FOLDER):
        if (notification.content.current_revision_type === 'status-update') {
          icon = 'fa-random'
          text = props.t('{{author}} updated the status of {{content}} at {{workspace}}', {
            author: notification.author,
            content: `<span class='contentTitle__highlight'>${notification.content.label}</span>`,
            workspace: `<span class='documentTitle__highlight'>${notification.workspace.label}</span>`,
            interpolation: { escapeValue: false }
          })
        } else {
          icon = 'fa-history'
          text = props.t('{{author}} updated a new version of {{content}} at {{workspace}}', {
            author: notification.author,
            content: `<span class='contentTitle__highlight'>${notification.content.label}</span>`,
            workspace: `<span class='documentTitle__highlight'>${notification.workspace.label}</span>`,
            interpolation: { escapeValue: false }
          })
        }
        url = `/ui/workspaces/${notification.workspace.workspace_id}/contents/${notification.content.content_type}/${notification.content.content_id}`
        break
      case buildTracimLiveMessageEventType(TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED):
        icon = 'fa-user-o'
        text = props.t('{{author}} added you to {{workspace}}', {
          author: notification.author,
          workspace: `<span class='documentTitle__highlight'>${notification.workspace.label}</span>`,
          interpolation: { escapeValue: false }
        })
        url = `/ui/workspaces/${notification.workspace.workspace_id}/dashboard`
        break
      case buildTracimLiveMessageEventType(TLM_ET.MENTION, TLM_CET.CREATED):
        if (notification.content.content_type === CONTENT_TYPE.COMMENT) {
          icon = 'fa-comment-o'
          text = props.t('{{author}} mentioned you in a comment in {{content}} at {{workspace}}', {
            author: notification.author,
            content: `<span class='contentTitle__highlight'>${notification.content.label}</span>`,
            workspace: `<span class='documentTitle__highlight'>${notification.workspace.label}</span>`,
            interpolation: { escapeValue: false }
          })
          url = `/ui/workspaces/${notification.workspace.workspace_id}/contents/${notification.content.parent_content_type}/${notification.content.content_id}`
        } else {
          icon = 'fa-at'
          text = props.t('{{author}} mentioned you in {{content}} at {{workspace}}', {
            author: notification.author,
            content: `<span class='contentTitle__highlight'>${notification.content.label}</span>`,
            workspace: `<span class='documentTitle__highlight'>${notification.workspace.label}</span>`,
            interpolation: { escapeValue: false }
          })
          url = `/ui/workspaces/${notification.workspace.workspace_id}/contents/${notification.content.content_type}/${notification.content.content_id}`
        }
        break
      default:
        icon = 'fa-bell'
        text = `${notification.author} ${notification.type}`
        url = notification.content
          ? `/ui/workspaces/${notification.workspace.workspace_id}/contents/${notification.content.content_type}/${notification.content.content_id}`
          : '/ui'
    }
    return { icon, text, url }
  }

  handleClickMarkAllAsRead = async () => {
    const { props } = this

    const fetchAllPutNotificationAsRead = await props.dispatch(putAllNotificationAsRead(props.user.userId))
    switch (fetchAllPutNotificationAsRead.status) {
      case 204: {
        props.notificationPage.list.forEach(notification => props.dispatch(updateNotification({ ...notification, read: true })))
        break
      }
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened while setting "mark all as read"'), 'warning'))
    }
  }

  render () {
    const { props, state } = this

    if (!state.isNotificationWallOpen || !props.notificationPage.list) return null

    return (
      <div className='notification'>
        <PopinFixedHeader
          customClass='notification'
          faIcon='bell-o'
          rawTitle={props.t('Notifications')}
          componentTitle={<div>{props.t('Notifications')}</div>}
          onClickCloseBtn={this.handleCloseNotificationWall}
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
            return (
              <ListItemWrapper
                isLast={i === props.notificationPage.list.length - 1}
                read={false}
                id={notification.id}
                key={notification.id}
              >
                <Link
                  to={this.getNotificationDetails(notification).url}
                  onClick={() => this.handleClickNotification(notification.id)}
                  className={
                    classnames('notification__list__item', { itemRead: notification.read })
                  }
                  key={notification.id}
                >
                  <i className={`notification__list__item__icon fa ${this.getNotificationDetails(notification).icon}`} />
                  <div className='notification__list__item__text'>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: `${this.getNotificationDetails(notification).text} `
                      }}
                    />
                    {displayDistanceDate(notification.created, props.user.lang)}
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
