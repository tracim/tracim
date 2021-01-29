import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { DropdownMenu, PAGE, ROLE } from 'tracim_frontend_lib'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

require('./BtnExtandedAction.styl')

export const ExtandedAction = props => {
  return (
    <DropdownMenu
      buttonIcon='fa-ellipsis-h'
      buttonTooltip={props.t('Actions')}
      buttonCustomClass='extandedaction outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
      buttonDataCy='extended_action'
      isButton
    >
      {props.onClickExtendedAction.edit && props.userRoleIdInWorkspace >= props.onClickExtendedAction.edit.allowedRoleId && (
        <button
          className='transparentButton'
          onClick={props.onClickExtendedAction.edit.callback}
          data-cy='extended_action_edit'
          key='extended_action_edit'
        >
          <i className='fas fa-fw fa-pencil' />
          {props.onClickExtendedAction.edit.label}
        </button>
      )}

      {/*
      <button className='transparentButton' onClick={props.onClickExtendedAction.download.callback}>
        <i className='fas fa-fw fa-download' />
        {props.onClickExtendedAction.download.label}
      </button>
      */}

      {/* INFO - G.B. - 2019-09-06 - For now, we decide to hide the archive function - https://github.com/tracim/tracim/issues/2347
      {props.onClickExtendedAction.archive && props.userRoleIdInWorkspace >= props.onClickExtendedAction.archive.allowedRoleId && (
        <button
          className='transparentButton'
          onClick={props.onClickExtendedAction.archive.callback}
          data-cy='extended_action_archive'
        >
          <i className='fas fa-fw fa-archive' />
          {props.onClickExtendedAction.archive.label}
        </button>
      )} */}

      {props.onClickExtendedAction.delete && props.userRoleIdInWorkspace >= props.onClickExtendedAction.delete.allowedRoleId && (
        <button
          className='transparentButton'
          onClick={props.onClickExtendedAction.delete.callback}
          data-cy='extended_action_delete'
          key='extended_action_delete'
        >
          <i className='fas fa-fw fa-trash-o' />
          {props.onClickExtendedAction.delete.label}
        </button>
      )}

      {/* FIXME - GM - 2019-04-16 - Don't use hardcoded slug and find a better way to handle app buttons like this one - https://github.com/tracim/tracim/issues/2654 */}
      {props.folderData && props.appList && props.appList.some((app) => app.slug === 'gallery') && (
        <Link
          onClick={e => e.stopPropagation()}
          data-cy='extended_action_gallery'
          to={`${PAGE.WORKSPACE.GALLERY(props.folderData.workspaceId)}?folder_ids=${props.folderData.id}`}
          key='extended_action_gallery'
        >
          <i className='fas fa-fw fa-picture-o' />
          {props.t('Gallery')}
        </Link>
      )}
    </DropdownMenu>
  )
}

const mapStateToProps = ({ appList }) => ({
  appList
})

export default connect(mapStateToProps)(translate()(ExtandedAction))

ExtandedAction.propTypes = {
  onClickExtendedAction: PropTypes.object.isRequired,
  userRoleIdInWorkspace: PropTypes.number
}

ExtandedAction.defaultProps = {
  userRoleIdInWorkspace: ROLE.reader.id
}
