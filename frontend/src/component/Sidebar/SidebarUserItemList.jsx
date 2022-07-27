import React from 'react'
import { translate } from 'react-i18next'
import { PAGE } from 'tracim_frontend_lib'
import { workspaceConfig } from '../../util/helper.js'
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

      {(props.showUserItems || props.sidebarClose) && (
        <>
          <SidebarItem
            customClass='sidebar__activities__item'
            to={PAGE.RECENT_ACTIVITIES}
            label={props.t('Recent activities')}
            icon='fas fa-newspaper'
            isCurrentItem={props.location.pathname === PAGE.RECENT_ACTIVITIES && !props.isNotificationWallOpen}
          />

          {props.isAgendaEnabled && (
            <SidebarItem
              customClass='sidebar__agendas__item'
              to={PAGE.AGENDA}
              label={props.t('Agendas')}
              icon='fas fa-calendar-alt'
              isCurrentItem={props.location.pathname === PAGE.AGENDA && !props.isNotificationWallOpen}
            />
          )}

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
            label={props.t('Favorites')}
            icon='fas fa-star'
            isCurrentItem={props.location.pathname === PAGE.FAVORITES && !props.isNotificationWallOpen}
          />

          {props.isUserAdministrator && (
            <SidebarItem
              customClass='sidebar__spaces__item'
              to={PAGE.ADMIN.WORKSPACE}
              label={props.t('Space management')}
              icon={workspaceConfig.faIcon}
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
            />
          )}

          <SidebarItem
            customClass='sidebar__account__item'
            to={PAGE.ACCOUNT}
            label={props.t('Account Settings')}
            icon='fas fa-cogs'
            isCurrentItem={props.location.pathname === PAGE.ACCOUNT && !props.isNotificationWallOpen}
            dataCy='menuprofile__dropdown__account__link'
          />

          <SidebarItem
            customClass='sidebar__logout__item'
            label={props.t('Log out')}
            icon='fas fa-sign-out-alt'
            onClickItem={props.onClickLogout}
            dataCy='menuprofile__dropdown__logout__link'
          />
        </>
      )}
    </>
  )
}
export default translate()(SidebarUserItemList)
