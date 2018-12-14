import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import SubDropdownCreateButton from './SubDropdownCreateButton.jsx'
import { translate } from 'react-i18next'

const DropdownCreateButton = props => {
  return (
    <div className={classnames(props.parentClass, props.customClass, 'dropdownCreateBtn')}>
      <button
        className={classnames(`${props.parentClass}__label`, 'dropdownCreateBtn__label btn highlightBtn primaryColorBg primaryColorBorderDarkenHover primaryColorBgDarkenHover dropdown-toggle')}
        type='button'
        id='dropdownCreateBtn'
        data-cy='dropdownCreateBtn'
        data-toggle='dropdown'
        aria-haspopup='true'
        aria-expanded='false'
      >
        <div className={classnames(`${props.parentClass}__label__text`, 'dropdownCreateBtn__label__text')}>
          {props.t('Create')}...
        </div>
      </button>

      <div
        className={classnames(`${props.parentClass}__setting`, 'dropdownCreateBtn__setting dropdown-menu')}
        aria-labelledby='dropdownCreateBtn'
      >
        <SubDropdownCreateButton
          idFolder={props.idFolder}
          availableApp={props.availableApp}
          onClickCreateContent={props.onClickCreateContent}
        />
      </div>
    </div>
  )
}

export default translate()(DropdownCreateButton)

DropdownCreateButton.propTypes = {
  availableApp: PropTypes.array.isRequired,
  onClickCreateContent: PropTypes.func.isRequired,
  parentClass: PropTypes.string,
  customClass: PropTypes.string,
  idFolder: PropTypes.number
}

DropdownCreateButton.defaultProps = {
  parentClass: '',
  customClass: ''
}
