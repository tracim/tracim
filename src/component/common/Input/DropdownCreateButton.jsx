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
          Créer un workspace
        </div>
        <div className='setting__link dropdown-item'>
          Créer un fichiers
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
