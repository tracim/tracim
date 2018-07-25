import React from 'react'
import PropTypes from 'prop-types'

const ExtandedAction = props => {
  return (
    <div className='extandedaction dropdown'>
      <button
        className='extandedaction__button btn btn-outline-primary dropdown-toggle'
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
        <div className='subdropdown__item dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.edit}>
          <div className='subdropdown__item__icon mr-3'>
            <i className='fa fa-fw fa-pencil' />
          </div>
          <div className='subdropdown__item__text'>
            Modifier
          </div>
        </div>

        <div className='subdropdown__item dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.move}>
          <div className='subdropdown__item__icon mr-3'>
            <i className='fa fa-fw fa-arrows-alt' />
          </div>
          <div className='subdropdown__item__text'>
            Déplacer
          </div>
        </div>

        {/* <div className='subdropdown__item dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.download}>
          <div className='subdropdown__item__icon mr-3'>
            <i className='fa fa-fw fa-download' />
          </div>
          <div className='subdropdown__item__text'>
            Télécharger
          </div>
        </div> */ }

        <div className='subdropdown__item dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.archive}>
          <div className='subdropdown__item__icon mr-3'>
            <i className='fa fa-fw fa-archive' />
          </div>
          <div className='subdropdown__item__text'>
            Archiver
          </div>
        </div>

        <div className='subdropdown__item dropdown-item d-flex align-items-center' onClick={props.onClickExtendedAction.delete}>
          <div className='subdropdown__item__icon mr-3'>
            <i className='fa fa-fw fa-trash-o' />
          </div>
          <div className='subdropdown__item__text'>
            Supprimer
          </div>
        </div>

      </div>
    </div>
  )
}

export default ExtandedAction

ExtandedAction.propTypes = {
  onClickExtendedAction: PropTypes.object.isRequired
}

ExtandedAction.defaultProps = {}
