import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { getNotificationList } from '../action-creator.async.js'
import {
  setNotificationList,
  updateNotification
} from '../action-creator.sync.js'
import {
  buildTracimLiveMessageEventType,
  displayDistanceDate,
  GenericButton,
  ListItemWrapper,
  PopinFixedHeader,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent
} from 'tracim_frontend_lib'

export class NotificationWall extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isNotificationWallOpen: true,
      hasMoreNotifications: true
    }
  }

  async componentDidMount () {
    const { props } = this

    const fetchGetNotificationWall = await props.dispatch(getNotificationList(props.user.userId))
    switch (fetchGetNotificationWall.status) {
      case 200:
        props.dispatch(setNotificationList(fetchGetNotificationWall.json))
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while loading notification list'))
    }
  }

  handleClickBtnClose = notificationId => {
    const { props } = this
    const notification = props.notificationList.find(notification => notification.id === notificationId)
    props.dispatch(updateNotification({ ...notification, read: true }))
    this.setState({ isNotificationWallOpen: false })
  }

  handleClickSeeMore = () => { }

  getNotificationDetails = notification => {
    const { props } = this
    let icon, text, url

    switch (notification.type) {
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT):
        icon = 'fa-comments-o'
        text = props.t(' commented on ')
        url = `/ui/workspaces/${notification.workspace.workspace_id}/dashboard`
        break
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.HTML_DOCUMENT):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.FILE):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.FOLDER):
        icon = 'fa-magic'
        text = props.t(' created ')
        url = `/ui/workspaces/${notification.workspace.workspace_id}/contents/${notification.content.content_type}/${notification.content.content_id}`
        break
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.HTML_DOCUMENT):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FILE):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD):
      case buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FOLDER):
        if (notification.content.current_revision_type === 'status-update') {
          icon = 'fa-random'
          text = props.t(' updated the status of ')
        } else {
          icon = 'fa-history'
          text = props.t(' updated a new version of ')
        }
        url = `/ui/workspaces/${notification.workspace.workspace_id}/contents/${notification.content.content_type}/${notification.content.content_id}`
        break
      case buildTracimLiveMessageEventType(TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED):
        icon = 'fa-user-o'
        text = props.t(' added you ')
        url = `/ui/workspaces/${notification.workspace.workspace_id}/dashboard`
        break
      default:
        icon = 'fa-bell'
        text = ` ${notification.type} `
        url = notification.content
          ? `/ui/workspaces/${notification.workspace.workspace_id}/contents/${notification.content.content_type}/${notification.content.content_id}`
          : ''
    }
    return { icon, text, url }
  }

  render () {
    const { props, state } = this

    if (!state.isNotificationWallOpen) return null

    return (
      <div className='notification'>
        <PopinFixedHeader
          customClass='notification'
          faIcon='bell-o'
          rawTitle={props.t('Notifications')}
          componentTitle={<div>{props.t('Notifications')}</div>}
          onClickCloseBtn={this.handleClickBtnClose}
        />

        <div className='notification__list'>
          {props.notificationList && props.notificationList.map((notification, i) => {
            return (
              <ListItemWrapper
                isLast={i === props.notificationList.length - 1}
                read={false}
                id={notification.id}
                key={notification.id}
              >
                <Link
                  to={this.getNotificationDetails(notification).url}
                  onClick={() => this.handleClickBtnClose(notification.id)}
                  className={
                    classnames('notification__list__item', { itemRead: notification.read })
                  }
                  key={notification.id}
                >
                  <i className={`notification__list__item__icon fa ${this.getNotificationDetails(notification).icon}`} />
                  <div className='notification__list__item__text'>
                    {notification.author} {this.getNotificationDetails(notification).text}
                    {notification.content ? <u>{notification.content.label}</u> : ' '}
                    {notification.workspace ? <span>{props.t(' at ')} <b>{notification.workspace.label} </b></span> : ' '}
                    {displayDistanceDate(notification.created, props.user.lang)}
                  </div>
                  {!notification.read && <i className='notification__list__item__circle fa fa-circle' />}
                </Link>
              </ListItemWrapper>
            )
          })}

          {state.hasMoreNotifications &&
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

const mapStateToProps = ({ user, notificationList }) => ({ user, notificationList })
export default connect(mapStateToProps)(translate()(TracimComponent(NotificationWall)))
