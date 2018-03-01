import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const InputGroupText = props => {
  return (
    <label className={classnames(`${props.parentClassName}`, props.customClass, 'custom-control custom-checkbox')}>
      <input
        type='checkbox'
        className='custom-control-input'
        checked={props.checked}
        onChange={props.onChange}
      />
      <span className={classnames(`${props.parentClassName}__checkbox`, 'custom-control-indicator')} />
      <span className={classnames(`${props.parentClassName}__label`, 'custom-control-description')}>
        {props.label}
      </span>
    </label>
  )
}

export default InputGroupText

InputGroupText.propTypes = {
  parentClassName: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  customClass: PropTypes.string,
  label: PropTypes.string
}

InputGroupText.defaultProps = {
  customClass: '',
  label: ''
}
