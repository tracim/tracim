import React from 'react'
import PropTypes from 'prop-types'
import { Link, withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import { Icon, PAGE } from 'tracim_frontend_lib'

const SidebarItem = (props) => {
  return (
    props.to
      ? (
        <Link
          className={classnames('sidebar__item',
            {
              'sidebar__item__current primaryColorBorder primaryColorBgOpacity': props.isCurrentItem
            },
            props.customClass
          )}
          to={props.to}
          data-cy={props.dataCy}
        >
          <div
            className='sidebar__item__name'
            title={props.label}
          >
            <Icon
              icon={props.icon}
              title={props.label}
              color={props.customColor}
            />
            <span>{props.label}</span>
          </div>
        </Link>
      ) : (
        <div
          className={classnames('sidebar__item', { sidebar__showTodoNumber: props.todoOpenCount > 0 })}
        >
          <button
            className={classnames('transparentButton',
              { 'sidebar__item__current primaryColorBorder primaryColorBgOpacity': props.isCurrentItem },
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
                color={props.customColor}
              />

              <span>{props.label}</span>

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

          {props.todoOpenCount > 0 && (
            <Link
              className='sidebar__todo'
              to={PAGE.TODO}
            >
              <button
                className='sidebar__todo__btn'
                title={props.t('My tasks')}
              >
                {props.todoOpenCount > 99 ? '99+' : props.todoOpenCount}
              </button>
            </Link>
          )}
        </div>
      )
  )
}
export default withRouter(translate()(SidebarItem))

SidebarItem.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  customColor: PropTypes.string,
  customClass: PropTypes.string,
  dataCy: PropTypes.string,
  isCurrentItem: PropTypes.bool,
  onClickItem: PropTypes.func,
  to: PropTypes.string,
  unreadMentionCount: PropTypes.number,
  unreadNotificationCount: PropTypes.number,
  todoOpenCount: PropTypes.number
}

SidebarItem.defaultProps = {
  customColor: '',
  customClass: '',
  dataCy: '',
  isCurrentItem: false,
  onClickItem: () => { },
  to: '',
  unreadMentionCount: 0,
  unreadNotificationCount: 0,
  todoOpenCount: 0
}
