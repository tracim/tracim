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
  GenericButton,
  ListItemWrapper,
  PopinFixedHeader,
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
          {props.notificationList.map((notification, i) => {
            return (
              <ListItemWrapper
                isLast={i === props.notificationList.length - 1}
                read={false}
                id={notification.id}
                key={notification.id}
              >
                <Link
                  to={notification.url}
                  onClick={() => this.handleClickBtnClose(notification.id)}
                  className={
                    classnames('notification__list__item', { itemRead: notification.read })
                  }
                  key={notification.id}
                >
                  <i className={`notification__list__item__icon fa ${notification.icon}`} />
                  <div>
                    {props.t(notification.text, {
                      author: notification.author,
                      content: notification.content,
                      workspace: notification.workspace,
                      interpolation: { escapeValue: false }
                    })}
                  </div>
                  {!notification.read && <i className='notification__list__item__circle fa fa-circle' />}
                </Link>
              </ListItemWrapper>
            )
          })}
        </div>

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
    )
  }
}

const mapStateToProps = ({ user, notificationList }) => ({ user, notificationList })
export default connect(mapStateToProps)(translate()(TracimComponent(NotificationWall)))
