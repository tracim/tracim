import React from 'react'
import { Link, withRouter } from 'react-router-dom'
import classnames from 'classnames'
import { isMobile } from 'react-device-detect'
import { Icon } from 'tracim_frontend_lib'

const SidebarItem = (props) => {
  return (
    props.to
      ? (
        <Link
          className={classnames('sidebar__item',
            {
              'sidebar__item__current primaryColorBorder': props.isCurrentItem
            }
          )}
          to={props.to}
          onClick={isMobile ? props.onClickToggleSidebar : () => { }}
          data-cy={props.dataCy}
        >
          <div
            className='sidebar__item__name'
            title={props.label}
          >
            <Icon
              icon={props.icon}
              title={props.label}
              color='#fdfdfd'
            />
            &nbsp;{props.label}
          </div>
        </Link>
      ) : (
        <button
          className={classnames('transparentButton sidebar__item',
            {
              'sidebar__item__current primaryColorBorder': props.isCurrentItem
            }
          )}
          onClick={props.onClickItem}
          data-cy={props.dataCy}
        >
          <div
            className='sidebar__item__name'
            title={props.label}
          >
            <Icon
              icon={props.icon}
              title={props.label}
              color='#fdfdfd'
            />
            &nbsp;{props.label}
            {props.unreadMentionCount > 0 && (
              <div
                className='notificationButton__mention' // TODO GIULIA Nommage et test
              >
                {props.unreadMentionCount > 99 ? '99+' : props.unreadMentionCount}
              </div>
            )}
            {props.unreadMentionCount === 0 && props.unreadNotificationCount > 0 && (
              <div className='notificationButton__notification' /> // TODO GIULIA Nommage et test
            )}
          </div>
        </button>
      )
  )
}
export default withRouter(SidebarItem)
