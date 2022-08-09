import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { PAGE } from 'tracim_frontend_lib'
import SidebarItem from './SidebarItem.jsx'
import MenuProfile from '../Header/MenuActionListItem/MenuProfile.jsx'

const SidebarUserItemList = (props) => {
  return (
    <>
      <MenuProfile
        isCurrentItem={props.location.pathname === PAGE.PUBLIC_PROFILE(props.user.userId) && !props.isNotificationWallOpen}
        onClickToggleUserItems={props.onClickToggleUserItems}
        showUserItems={props.showUserItems}
        user={props.user}
      />

      {(props.showUserItems || props.isSidebarClosed) && (
        <>
          {props.isToDoEnabled && (
            <SidebarItem
              customClass='sidebar__tasks__item'
              to={PAGE.TODO}
              label={props.t('My tasks')}
              icon='fas fa-check-square'
              isCurrentItem={props.location.pathname === PAGE.TODO && !props.isNotificationWallOpen}
            />
          )}

          <SidebarItem
            customClass='sidebar__favorites__item'
            to={PAGE.FAVORITES}
            label={props.t('My favorites')}
            icon='fas fa-star'
            isCurrentItem={props.location.pathname === PAGE.FAVORITES && !props.isNotificationWallOpen}
          />

          {props.isUserAdministrator && (
            <SidebarItem
              customClass='sidebar__spaces__item'
              to={PAGE.ADMIN.WORKSPACE}
              label={props.t('Space management')}
              icon='fas fa-users-cog'
              isCurrentItem={props.location.pathname === PAGE.ADMIN.WORKSPACE && !props.isNotificationWallOpen}
            />
          )}

          {props.isUserAdministrator && (
            <SidebarItem
              customClass='sidebar__users__item'
              to={PAGE.ADMIN.USER}
              label={props.t('User account management')}
              icon='fas fa-user-cog'
              isCurrentItem={props.location.pathname === PAGE.ADMIN.USER && !props.isNotificationWallOpen}
              dataCy='sidebar__admin__user'
            />
          )}

          <SidebarItem
            customClass='sidebar__account__item'
            to={PAGE.ACCOUNT}
            label={props.t('Account Settings')}
            icon='fas fa-cogs'
            isCurrentItem={props.location.pathname === PAGE.ACCOUNT && !props.isNotificationWallOpen}
            dataCy='sidebar__account__settings'
          />

          <SidebarItem
            customClass='sidebar__logout__item'
            label={props.t('Log out')}
            icon='fas fa-sign-out-alt'
            onClickItem={props.onClickLogout}
            dataCy='sidebar__logout'
          />
        </>
      )}
    </>
  )
}
export default translate()(SidebarUserItemList)

SidebarUserItemList.propTypes = {
  location: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  isAgendaEnabled: PropTypes.bool,
  isNotificationWallOpen: PropTypes.bool,
  isSidebarClosed: PropTypes.bool,
  isToDoEnabled: PropTypes.bool,
  isUserAdministrator: PropTypes.bool,
  onClickLogout: PropTypes.func,
  onClickToggleUserItems: PropTypes.func,
  showUserItems: PropTypes.bool
}

SidebarUserItemList.defaultProps = {
  isAgendaEnabled: false,
  isNotificationWallOpen: false,
  isSidebarClosed: false,
  isToDoEnabled: false,
  isUserAdministrator: false,
  onClickLogout: () => { },
  onClickToggleUserItems: () => { },
  showUserItems: true
}
