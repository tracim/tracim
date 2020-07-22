import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
// import { withRouter } from 'react-router'
import classnames from 'classnames'
import { translate } from 'react-i18next'
// import { isMobile } from 'react-device-detect'
// import appFactory from '../util/appFactory.js'
import {
  setNotificationList
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
      hasMoreNotifications: true,
      notificationList: [{
        text: 'a',
        icon: 'fa-bell',
        read: false
      }, {
        text: 'b',
        icon: 'fa-bell',
        read: true
      }, {
        text: 'c',
        icon: 'fa-bell',
        read: true
      }, {
        text: 'd',
        icon: 'fa-bell',
        read: false
      }, {
        text: 'd',
        icon: 'fa-bell',
        read: true
      }]
    }
  }

  componentDidMount () {
    this.props.dispatch(setNotificationList(this.state.notificationList))
  }

  handleClickBtnClose = () => this.setState({ isNotificationWallOpen: false })

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
                  to='/ui'
                  onClick={this.handleClickBtnClose}
                  className={
                    classnames('notification__list__item', { itemRead: notification.read })
                  }
                  key={notification.id}
                >
                  <i className={`notification__list__item__icon fa ${notification.icon}`} />
                  <div>{notification.text}</div>
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
