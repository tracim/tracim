import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const InputGroupText = props => {
  return (
    <div className={classnames(`${props.parentClassName}`, props.customClass, 'form-check')}>
      <label className={classnames(`${props.parentClassName}__label`, 'form-check-label')}>
        <input type='checkbox' className={classnames(`${props.parentClassName}__label__checkbox`, 'form-check-input')} />
        {props.label}
      </label>
    </div>
  )
}

export default InputGroupText

InputGroupText.PropTypes = {
  parentClassName: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  label: PropTypes.string
}

InputGroupText.defaultProps = {
  customClass: '',
  label: ''
}
