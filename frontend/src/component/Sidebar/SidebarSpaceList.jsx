import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  createSpaceTree,
  ROLE_LIST,
  sortWorkspaceList
} from 'tracim_frontend_lib'
import {
  findUserRoleIdInWorkspace,
  NO_ACTIVE_SPACE_ID
} from '../../util/helper.js'
import SidebarItem from './SidebarItem.jsx'
import SidebarSpaceItem from './SidebarSpaceItem.jsx'

const SidebarSpaceList = (props) => {
  const displaySpace = (spaceLevel, spaceList) => {
    return spaceList.map(space =>
      <React.Fragment key={space.id}>
        <SidebarSpaceItem
          activeWorkspaceId={props.activeWorkspaceId}
          allowedAppList={space.sidebarEntryList}
          foldChildren={!!props.foldedSpaceList.find(id => id === space.id)}
          hasChildren={space.children.length > 0}
          id={`sidebar-space-item-${space.id}`}
          label={space.label}
          level={spaceLevel}
          onClickAllContent={props.onClickAllContent}
          onClickToggleSidebar={props.onClickToggleSidebar}
          onToggleFoldChildren={() => props.onToggleFoldChildren(space.id)}
          userRoleIdInWorkspace={[findUserRoleIdInWorkspace(props.userId, space.memberList, ROLE_LIST)]}
          workspaceId={space.id}
          isNotificationWallOpen={props.isNotificationWallOpen}
        />
        {!props.foldedSpaceList.find(id => id === space.id) &&
          space.children.length !== 0 &&
          displaySpace(spaceLevel + 1, space.children)}
      </React.Fragment>
    )
  }

  return (
    <>
      <SidebarItem
        customClass='sidebar__title'
        label={props.t('Spaces')}
        icon={props.isSidebarClosed ? 'fas fa-users' : `fas fa-caret-${props.showSpaceList ? 'down' : 'right'}`}
        onClickItem={props.isSidebarClosed ? props.onClickToggleSidebar : props.onClickToggleSpaceList}
      />

      {props.showSpaceList && (
        <div className='sidebar__spaces'>
          {displaySpace(0, createSpaceTree(sortWorkspaceList(props.spaceList)))}
        </div>
      )}
    </>
  )
}
export default translate()(SidebarSpaceList)

SidebarSpaceList.propTypes = {
  userId: PropTypes.number.isRequired,
  activeWorkspaceId: PropTypes.number,
  foldedSpaceList: PropTypes.array,
  isNotificationWallOpen: PropTypes.bool,
  isSidebarClosed: PropTypes.bool,
  onClickAllContent: PropTypes.func,
  onClickToggleSidebar: PropTypes.func,
  onClickToggleSpaceList: PropTypes.func,
  onToggleFoldChildren: PropTypes.func,
  showSpaceList: PropTypes.bool,
  spaceList: PropTypes.array
}

SidebarSpaceList.defaultProps = {
  activeWorkspaceId: NO_ACTIVE_SPACE_ID,
  foldedSpaceList: [],
  isNotificationWallOpen: false,
  isSidebarClosed: false,
  onClickAllContent: () => { },
  onClickToggleSidebar: () => { },
  onClickToggleSpaceList: () => { },
  onToggleFoldChildren: () => { },
  showSpaceList: true,
  spaceList: []
}
