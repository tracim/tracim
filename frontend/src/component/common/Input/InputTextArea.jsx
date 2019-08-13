import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

require('./InputTextArea.styl')

const InputTextArea = props => {
  return (
    <textarea
      className={classnames('inputTextArea', props.customClass, 'form-control')}
      placeholder={props.placeHolder}
      rows={props.numberRows}
      value={props.value}
      onChange={props.onChange}
      onKeyDown={props.onKeyDown}
      maxLength={props.maxLength}
    />
  )
}

export default InputTextArea

InputTextArea.propTypes = {
  value: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  placeHolder: PropTypes.string,
  numberRows: PropTypes.string,
  onChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  maxLength: PropTypes.number
}

InputTextArea.defaultProps = {
  customClass: '',
  placeHolder: '',
  numberRows: '',
  onChange: () => {},
  onKeyDown: () => {},
  maxLength: 1024
}
