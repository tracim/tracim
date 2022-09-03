import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import { FETCH_CONFIG } from '../../../util/helper.js'
import {
  Avatar,
  AVATAR_SIZE,
  DropdownMenu,
  IconButton,
  PAGE
} from 'tracim_frontend_lib'
import { LOCK_TOGGLE_SIDEBAR_WHEN_OPENED_ON_MOBILE } from '../../../container/Sidebar.jsx'

export const MenuProfile = props => {
  if (!props.user.logged) return null

  return (
    <div className='sidebar__item sidebar__title'>
      {props.isSidebarClosed
        ? (
          <button
            className={`transparentButton btn ${LOCK_TOGGLE_SIDEBAR_WHEN_OPENED_ON_MOBILE}`}
            onClick={props.onClickOpenUserItems}
          >
            <Avatar
              size={AVATAR_SIZE.SMALL}
              user={props.user}
              apiUrl={FETCH_CONFIG.apiUrl}
              key='sidebar__profile__item__avatar'
            />
          </button>
        ) : (
          <button
            className={`sidebar__item transparentButton btn sidebar__title__button ${LOCK_TOGGLE_SIDEBAR_WHEN_OPENED_ON_MOBILE}`}
            onClick={props.onClickToggleUserItems}
            title={props.showUserItems ? props.t('Hide user menu') : props.t('Show user menu')}
          >
            <i className={`fa-fw fas fa-chevron-${props.showUserItems ? 'down' : 'right'}`} />
            <span>
              <Avatar
                size={AVATAR_SIZE.SMALL}
                user={props.user}
                apiUrl={FETCH_CONFIG.apiUrl}
                key='sidebar__profile__item__avatar'
              />
              &nbsp;{props.user.publicName}
            </span>
          </button>
        )}

      <DropdownMenu
        buttonCustomClass='sidebar__item__menu'
        buttonIcon='fas fa-ellipsis-v'
        buttonTooltip={props.t('Actions')}
        itemCustomClass='sidebar__item__menu__element'
      >
        <Link
          data-cy='sidebar__profile__item'
          key='sidebar__profile__item'
          to={PAGE.PUBLIC_PROFILE(props.user.userId)}
        >
          <i className='fa-fw fas fa-user' />
          {props.t('My profile')}
        </Link>

        <Link
          data-cy='sidebar__account__item'
          key='sidebar__account__item'
          to={PAGE.ACCOUNT}
        >
          <i className='fa-fw fas fa-cogs' />
          {props.t('Account Settings')}
        </Link>

        {props.isUserAdministrator && (
          <Link to={PAGE.ADMIN.WORKSPACE} key='sidebar__spaces__item'>
            <i className='fa-fw fas fa-users-cog' />
            {props.t('Space management')}
          </Link>
        )}

        {props.isUserAdministrator && (
          <Link
            data-cy='sidebar__users__item'
            key='sidebar__users__item'
            to={PAGE.ADMIN.USER}
          >
            <i className='fa-fw fas fa-user-cog' />
            {props.t('User account management')}
          </Link>
        )}

        <IconButton
          customClass='sidebar__item__menu__logout'
          key='sidebar__logout__item'
          dataCy='sidebar__logout__item'
          icon='fas fa-sign-out-alt'
          intent='link'
          onClick={props.onClickLogout}
          text={props.t('Log out')}
          textMobile={props.t('Log out')}
        />
      </DropdownMenu>
    </div>
  )
}
export default translate()(MenuProfile)

MenuProfile.propTypes = {
  user: PropTypes.object.isRequired,
  isCurrentItem: PropTypes.bool,
  isSidebarClosed: PropTypes.bool,
  isUserAdministrator: PropTypes.bool,
  onClickOpenUserItems: PropTypes.func,
  onClickToggleUserItems: PropTypes.func,
  showUserItems: PropTypes.bool
}

MenuProfile.defaultProps = {
  isCurrentItem: false,
  isSidebarClosed: false,
  isUserAdministrator: false,
  onClickOpenUserItems: () => { },
  onClickToggleUserItems: () => { },
  showUserItems: true
}
