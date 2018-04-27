import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const DropdownCreateButton = props => {
  return (
    <div className={classnames(props.parentClass, props.customClass, 'dropdownCreateBtn')}>
      <button
        className={classnames(`${props.parentClass}__label`, 'dropdownCreateBtn__label btn btn-succes dropdown-toggle')}
        type='button'
        id='dropdownCreateBtn'
        data-toggle='dropdown'
        aria-haspopup='true'
        aria-expanded='false'
      >
        <div className={classnames(`${props.parentClass}__label__text`, 'dropdownCreateBtn__label__text')}>
          Créer ...
        </div>
      </button>

      <div
        className={classnames(`${props.parentClass}__setting`, 'dropdownCreateBtn__setting dropdown-menu')}
        aria-labelledby='dropdownCreateBtn'
      >
        <div className='setting__link dropdown-item'>
          <div className='setting__link__folder d-flex align-items-center'>
            <div className='setting__link__folder__icon mr-3'>
              <i className='fa fa-fw fa-folder-o' />
            </div>
            <div className='setting__link__folder__text'>
              Créer un dossier
            </div>
          </div>
        </div>
        <div className='setting__link dropdown-item'>
          <div className='setting__link__apphtml d-flex align-items-center'>
            <div className='setting__link__apphtml__icon mr-3'>
              <i className='fa fa-fw fa-file-text-o' />
            </div>
            <div className='setting__link__apphtml__text'>
              Rédiger un document
            </div>
          </div>
        </div>
        <div className='setting__link dropdown-item'>
          <div className='setting__link__appfile d-flex align-items-center'>
            <div className='setting__link__appfile__icon mr-3'>
              <i className='fa fa-fw fa-file-image-o' />
            </div>
            <div className='setting__link__appfile__text'>
              Importer un fichier
            </div>
          </div>
        </div>
        <div className='setting__link dropdown-item'>
          <div className='setting__link__appmarkdown d-flex align-items-center'>
            <div className='setting__link__appmarkdown__icon mr-3'>
              <i className='fa fa-fw fa-file-code-o' />
            </div>
            <div className='setting__link__appmarkdown__text'>
              Rédiger un document markdown
            </div>
          </div>
        </div>
        <div className='setting__link dropdown-item'>
          <div className='setting__link__appthread d-flex align-items-center'>
            <div className='setting__link__appthread__icon mr-3'>
              <i className='fa fa-fw fa-comments-o' />
            </div>
            <div className='setting__link__appthread__text'>
              Lancer une discussion
            </div>
          </div>
        </div>
        <div className='setting__link dropdown-item'>
          <div className='setting__link__apptask d-flex align-items-center'>
            <div className='setting__link__apptask__icon mr-3'>
              <i className='fa fa-fw fa-list-ul' />
            </div>
            <div className='setting__link__apptask__text'>
              Créer une tâche
            </div>
          </div>
        </div>
        <div className='setting__link dropdown-item'>
          <div className='setting__link__appissue d-flex align-items-center'>
            <div className='setting__link__appissue__icon mr-3'>
              <i className='fa fa-fw fa-ticket' />
            </div>
            <div className='setting__link__appissue__text'>
              Ouvrir un ticket
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DropdownCreateButton

DropdownCreateButton.propTypes = {
  parentClass: PropTypes.string,
  customClass: PropTypes.string
}

DropdownCreateButton.defaultProps = {
  parentClass: '',
  customClass: ''
}
