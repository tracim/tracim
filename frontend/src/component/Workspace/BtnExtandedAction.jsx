import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { ROLE } from 'tracim_frontend_lib'
import { connect } from 'react-redux'
import { PAGE } from '../../helper'
import { Link } from 'react-router-dom'

export const ExtandedAction = props => {
  return (
    <div
      className='extandedaction dropdown'
      data-cy='extended_action'
    >
      <button
        className='extandedaction__button btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover dropdown-toggle'
        type='button'
        id='dropdownMenuButton'
        data-toggle='dropdown'
        aria-haspopup='true'
        aria-expanded='false'
        onClick={e => e.stopPropagation()}
      >
        <i className='fa fa-fw fa-ellipsis-h' />
      </button>

      <div className='extandedaction__subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
        {props.onClickExtendedAction.edit && props.userRoleIdInWorkspace >= ROLE.contributor.id && (
          <div
            className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center'
            onClick={props.onClickExtendedAction.edit.callback}
            data-cy='extended_action_edit'
          >
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-pencil' />
            </div>

            <div className='subdropdown__item__text'>
              {props.onClickExtendedAction.edit.label}
            </div>
          </div>
        )}

        {/*
        <div className='subdropdown__item dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.download.callback}>
          <div className='subdropdown__item__icon mr-3'>
            <i className='fa fa-fw fa-download' />
          </div>
          <div className='subdropdown__item__text'>
            {props.onClickExtendedAction.download.label}
          </div>
        </div>
        */}

        {/* INFO - G.B. - 2019-09-06 - For now, we decide to hide the archive function - https://github.com/tracim/tracim/issues/2347
        {props.userRoleIdInWorkspace >= 4 && (
          <div
            className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center'
            onClick={props.onClickExtendedAction.archive.callback}
            data-cy='extended_action_archive'
          >
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-archive' />
            </div>

            <div className='subdropdown__item__text'>
              {props.onClickExtendedAction.archive.label}
            </div>
          </div>
        )} */}

        {props.userRoleIdInWorkspace >= ROLE.contentManager.id && (
          <div
            className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center'
            onClick={props.onClickExtendedAction.delete.callback}
            data-cy='extended_action_delete'
          >
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-trash-o' />
            </div>

            <div className='subdropdown__item__text'>
              {props.onClickExtendedAction.delete.label}
            </div>
          </div>
        )}

        // FIXME - GM - 2019-04-16 - Don't use hardcoded slug and find a better way to handle app buttons like this one
        {props.folderData && props.appList && props.appList.some((app) => app.slug === 'gallery') && (
          <Link
            className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center'
            onClick={e => e.stopPropagation()}
            data-cy='extended_action_gallery'
            to={`${PAGE.WORKSPACE.GALLERY(props.folderData.workspaceId)}?folder_ids=${props.folderData.id}`}
          >
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-picture-o' />
            </div>

            <div className='subdropdown__item__text'>
              {props.t('Gallery')}
            </div>
          </Link>
        )}
      </div>
    </div>
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
