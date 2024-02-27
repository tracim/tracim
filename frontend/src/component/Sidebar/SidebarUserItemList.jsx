import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { PAGE } from 'tracim_frontend_lib'
import SidebarItem from './SidebarItem.jsx'
import MenuProfile from '../Header/MenuActionListItem/MenuProfile.jsx'

const SidebarUserItemList = (props) => {
  return (
    <>
      <MenuProfile
        isCurrentItem={props.location.pathname === PAGE.PUBLIC_PROFILE(props.user.userId) && !props.isNotificationWallOpen}
        isSidebarClosed={props.isSidebarClosed}
        isUserAdministrator={props.isUserAdministrator}
        onClickLogout={props.onClickLogout}
        onClickOpenUserItems={props.onClickOpenUserItems}
        onClickToggleUserItems={props.onClickToggleUserItems}
        showUserItems={props.showUserItems}
        user={props.user}
      />

      {(props.showUserItems || props.isSidebarClosed) && (
        <>
          {props.isToDoEnabled && (
            <SidebarItem
              customClass='sidebar__tasks__item sidebar__item__inside_menu'
              to={PAGE.TODO}
              label={props.t('My tasks')}
              icon='fas fa-check-square'
              isCurrentItem={props.location.pathname === PAGE.TODO && !props.isNotificationWallOpen}
            />
          )}

          <SidebarItem
            customClass='sidebar__favorites__item sidebar__item__inside_menu'
            to={PAGE.FAVORITES}
            label={props.t('My favorites')}
            icon='fas fa-star'
            isCurrentItem={props.location.pathname === PAGE.FAVORITES && !props.isNotificationWallOpen}
          />

          {props.isAgendaEnabled && (
            <SidebarItem
              customColor={props.appList.find(app => app.slug === 'agenda').hexcolor}
              customClass='sidebar__agendas__item sidebar__item__inside_menu'
              to={PAGE.AGENDA}
              label={props.t('My agendas')}
              icon='fas fa-calendar-alt'
              isCurrentItem={props.location.pathname === PAGE.AGENDA && !props.isNotificationWallOpen}
            />
          )}
        </>
      )}
    </>
  )
}
const mapStateToProps = ({ appList }) => ({ appList })
export default connect(mapStateToProps)(translate()(SidebarUserItemList))

SidebarUserItemList.propTypes = {
  location: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  isAgendaEnabled: PropTypes.bool,
  isNotificationWallOpen: PropTypes.bool,
  isSidebarClosed: PropTypes.bool,
  isToDoEnabled: PropTypes.bool,
  isUserAdministrator: PropTypes.bool,
  onClickLogout: PropTypes.func,
  onClickOpenUserItems: PropTypes.func,
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
  onClickOpenUserItems: () => { },
  onClickToggleUserItems: () => { },
  showUserItems: true
}
