import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  ROLE_LIST,
  SORT_BY,
  Icon,
  IconButton,
  Loading,
  createSpaceTree,
  sortListByMultipleCriteria
} from 'tracim_frontend_lib'
import {
  findUserRoleIdInWorkspace,
  NO_ACTIVE_SPACE_ID
} from '../../util/helper.js'
import { LOCK_TOGGLE_SIDEBAR_WHEN_OPENED_ON_MOBILE } from '../../container/Sidebar.jsx'
import SidebarSpaceItem from './SidebarSpaceItem.jsx'

const SidebarSpaceList = (props) => {
  const displaySpace = (spaceLevel, spaceList) => {
    return spaceList.map(space =>
      <React.Fragment key={space.id}>
        <SidebarSpaceItem
          activeSpaceId={props.activeSpaceId}
          allowedAppList={space.sidebarEntryList}
          foldChildren={!!props.foldedSpaceList.find(id => id === space.id)}
          hasChildren={space.children.length > 0}
          id={`sidebar-space-item-${space.id}`}
          isNotificationWallOpen={props.isNotificationWallOpen}
          label={space.label}
          level={spaceLevel}
          onToggleFoldChildren={props.onToggleFoldChildren}
          spaceId={space.id}
          spaceType={space.accessType}
          userRoleIdInWorkspace={[findUserRoleIdInWorkspace(props.userId, space.memberList, ROLE_LIST)]}
        />
        {!props.foldedSpaceList.find(id => id === space.id) &&
          space.children.length !== 0 &&
          displaySpace(spaceLevel + 1, space.children)}
      </React.Fragment>
    )
  }

  const getTitleIcon = () => {
    if (props.isSidebarClosed) return 'fas fa-users'
    if (props.spaceList.length === 0) return ''
    if (props.showSpaceList) return 'fas fa-chevron-down'
    return 'fas fa-chevron-right'
  }

  const handleClickTitle = () => {
    if (props.isSidebarClosed) {
      props.onClickOpenSpaceList()
    } else {
      if (props.spaceList.length === 0) {
        if (props.accessibleWorkspaceList.length > 0) props.onClickJoinWorkspace()
        else {
          if (props.isUserManager || props.isUserAdministrator) props.onClickNewSpace()
        }
      } else props.onClickToggleSpaceList()
    }
  }

  return (
    <>
      <div className='sidebar__item sidebar__title'>
        <button
          className={`transparentButton btn sidebar__title__button ${LOCK_TOGGLE_SIDEBAR_WHEN_OPENED_ON_MOBILE}`}
          title={props.showSpaceList ? props.t('Hide space list') : props.t('Show space list')}
          onClick={handleClickTitle}
        >
          <Icon
            icon={getTitleIcon()}
            title={props.showSpaceList ? props.t('Hide space list') : props.t('Show space list')}
          />
          <span>{props.t('Spaces')}</span>
        </button>
        {props.accessibleWorkspaceList.length > 0 && (
          <IconButton
            customClass='sidebar__title__button__join'
            onClick={props.onClickJoinWorkspace}
            dataCy='sidebarJoinSpaceBtn'
            icon='fas fa-users'
            title={props.t('Join a space')}
            intent='link'
            mode='light'
          />
        )}

        {(props.isUserManager || props.isUserAdministrator) && (
          <IconButton
            customClass='sidebar__title__button__create'
            onClick={props.onClickNewSpace}
            dataCy='sidebarCreateSpaceBtn'
            icon='fas fa-plus'
            title={props.t('Create a space')}
            intent='link'
            mode='light'
          />
        )}
      </div>
      {props.isSpaceListLoaded ? (
        <>
          {props.showSpaceList && props.spaceList.length !== 0 && (
            <div className='sidebar__spaces'>
              {displaySpace(0, createSpaceTree(sortListByMultipleCriteria(props.spaceList, [SORT_BY.LABEL, SORT_BY.ID])))}
            </div>
          )}

          {!props.isSidebarClosed && props.spaceList && props.spaceList.length === 0 && (
            <div className='sidebar__spaces__empty'>
              {props.t("You aren't member of any space yet")}
            </div>
          )}
        </>
      ) : (
        <Loading
          height={48}
          width={48}
        />
      )}

    </>
  )
}
export default translate()(SidebarSpaceList)

SidebarSpaceList.propTypes = {
  userId: PropTypes.number.isRequired,
  activeSpaceId: PropTypes.number,
  foldedSpaceList: PropTypes.array,
  isNotificationWallOpen: PropTypes.bool,
  isSidebarClosed: PropTypes.bool,
  isSpaceListLoaded: PropTypes.bool,
  onClickToggleSpaceList: PropTypes.func,
  onToggleFoldChildren: PropTypes.func,
  showSpaceList: PropTypes.bool,
  spaceList: PropTypes.array
}

SidebarSpaceList.defaultProps = {
  activeSpaceId: NO_ACTIVE_SPACE_ID,
  foldedSpaceList: [],
  isNotificationWallOpen: false,
  isSidebarClosed: false,
  isSpaceListLoaded: false,
  onClickToggleSpaceList: () => { },
  onToggleFoldChildren: () => { },
  showSpaceList: true,
  spaceList: []
}
