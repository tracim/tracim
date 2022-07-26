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
            },
            props.customClass
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
            />
            <span>&nbsp;{props.label}</span>
          </div>
        </Link>
      ) : (
        <button
          className={classnames('transparentButton sidebar__item',
            {
              'sidebar__item__current primaryColorBorder': props.isCurrentItem
            },
            props.customClass
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
            />
            <span>&nbsp;{props.label}</span>
            {props.unreadMentionCount > 0 && (
              <div className='sidebar__mention'>
                {props.unreadMentionCount > 99 ? '99+' : props.unreadMentionCount}
              </div>
            )}
            {props.unreadMentionCount === 0 && props.unreadNotificationCount > 0 && (
              <div className='sidebar__notification' />
            )}
          </div>
        </button>
      )
  )
}
export default withRouter(SidebarItem)
