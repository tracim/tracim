import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

const ExtandedAction = props => {
  return (
    <div className='extandedaction dropdown'>
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
        {props.onClickExtendedAction.edit && props.idRoleUserWorkspace >= 2 &&
          <div className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.edit}>
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-pencil' />
            </div>

            <div className='subdropdown__item__text'>
              {props.t('Edit')}
            </div>
          </div>
        }

        {props.onClickExtendedAction.move && props.idRoleUserWorkspace >= 4 &&
          <div className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.move}>
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-arrows-alt' />
            </div>

            <div className='subdropdown__item__text'>
              {props.t('Move')}
            </div>
          </div>
        }

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

        {props.idRoleUserWorkspace >= 4 &&
          <div className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.archive}>
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-archive' />
            </div>

            <div className='subdropdown__item__text'>
              {props.t('Archive')}
            </div>
          </div>
        }

        {props.idRoleUserWorkspace >= 4 &&
          <div className='subdropdown__item primaryColorBgLightenHover dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.delete}>
            <div className='subdropdown__item__icon mr-3'>
              <i className='fa fa-fw fa-trash-o' />
            </div>

            <div className='subdropdown__item__text'>
              {props.t('Delete')}
            </div>
          </div>
        }

      </div>
    </div>
  )
}

export default translate()(ExtandedAction)

ExtandedAction.propTypes = {
  onClickExtendedAction: PropTypes.object.isRequired
}

ExtandedAction.defaultProps = {}
