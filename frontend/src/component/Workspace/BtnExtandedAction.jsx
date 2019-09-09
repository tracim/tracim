import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

const ExtandedAction = props => {
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
        {props.onClickExtendedAction.edit && props.userRoleIdInWorkspace >= 2 && (
          <div
            className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center'
            onClick={props.onClickExtendedAction.edit}
            data-cy='extended_action_edit'
          >
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-pencil' />
            </div>

            <div className='subdropdown__item__text'>
              {props.t('Edit')}
            </div>
          </div>
        )}

        {/*
        <div className='subdropdown__item dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.download}>
          <div className='subdropdown__item__icon mr-3'>
            <i className='fa fa-fw fa-download' />
          </div>
          <div className='subdropdown__item__text'>
            {props.t('Download')}
          </div>
        </div>
        */}

        {/* INFO - G.B. - 2019-09-06 - For now, we decide to hide the archive function - https://github.com/tracim/tracim/issues/2347
        {props.userRoleIdInWorkspace >= 4 && (
          <div
            className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center'
            onClick={props.onClickExtendedAction.archive}
            data-cy='extended_action_archive'
          >
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-archive' />
            </div>

            <div className='subdropdown__item__text'>
              {props.t('Archive')}
            </div>
          </div>
        )} */}

        {props.userRoleIdInWorkspace >= 4 && (
          <div
            className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center'
            onClick={props.onClickExtendedAction.delete}
            data-cy='extended_action_delete'
          >
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-trash-o' />
            </div>

            <div className='subdropdown__item__text'>
              {props.t('Delete')}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default translate()(ExtandedAction)

ExtandedAction.propTypes = {
  onClickExtendedAction: PropTypes.object.isRequired,
  userRoleIdInWorkspace: PropTypes.number
}

ExtandedAction.defaultProps = {
  userRoleIdInWorkspace: 0
}
