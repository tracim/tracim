import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const Button = props => {
  return (
    <button
      type={props.htmlType}
      className={classnames(props.customClass, 'btn', `btn-${props.bootstrapType}`)}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  )
}

export default Button

Button.propTypes = {
  htmlType: PropTypes.oneOf(['button', 'submit', 'reset']).isRequired,
  bootstrapType: PropTypes.oneOf(
    ['primary', 'default', 'default', 'success', 'danger', 'warning', 'info', 'light', 'dark', '']
  ).isRequired,
  customClass: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func
}

Button.defaultProps = {
  customClass: '',
  label: '',
  onClick: () => {}
}
