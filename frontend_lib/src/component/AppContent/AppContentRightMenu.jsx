import React from 'react'
import PropTypes from 'prop-types'
import { ROLE, APP_FEATURE_MODE } from '../../helper.js'
import EmojiReactions from '../../container/EmojiReactions.jsx'
import SelectStatus from '../Input/SelectStatus/SelectStatus.jsx'
import ArchiveDeleteContent from '../OptionComponent/ArchiveDeleteContent.jsx'
// require('./AppContentRightMenu.styl') // see https://github.com/tracim/tracim/issues/1156

const AppContentRightMenu = (props) => (
  <div className='appContentRightMenu'>
    <EmojiReactions
      apiUrl={props.apiUrl}
      loggedUser={props.loggedUser}
      contentId={props.content.content_id}
      workspaceId={props.content.workspace_id}
    />

    {props.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
      <SelectStatus
        selectedStatus={props.availableStatuses.find(s => s.slug === props.content.status)}
        availableStatus={props.availableStatuses}
        onChangeStatus={props.onChangeStatus}
        disabled={props.mode === APP_FEATURE_MODE.REVISION || props.content.is_archived || props.content.is_deleted}
      />
    )}

    {props.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id && (
      <ArchiveDeleteContent
        customColor={props.hexcolor}
        onClickArchiveBtn={props.onClickArchive}
        onClickDeleteBtn={props.onClickDelete}
        disabled={props.mode === APP_FEATURE_MODE.REVISION || props.content.is_archived || props.content.is_deleted}
      />
    )}
  </div>
)

AppContentRightMenu.propTypes = {
  onChangeStatus: PropTypes.func.isRequired,
  onClickDelete: PropTypes.func.isRequired,
  availableStatuses: PropTypes.array.isRequired,
  apiUrl: PropTypes.string.isRequired,
  content: PropTypes.object.isRequired,
  loggedUser: PropTypes.object.isRequired,
  mode: PropTypes.oneOf(Object.values(APP_FEATURE_MODE)),
  onClickArchive: PropTypes.func
}

AppContentRightMenu.defaultProps = {
  mode: undefined,
  onClickArchive: () => {}
}

export default AppContentRightMenu
