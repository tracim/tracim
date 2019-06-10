import React from 'react'
import PropTypes from 'prop-types'

const IconButton = props =>
  <button
    className={`btn ${props.className}`}
    onClick={props.onClick}
    disabled={props.disabled}
    style={props.style}
  >
    <i className={`fa fa-fw fa-${props.icon}`} /> {props.text}
  </button>

IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  text: PropTypes.string,
  style: PropTypes.object
}

IconButton.defaultProps = {
  className: '',
  onClick: () => {},
  disabled: false,
  text: '',
  style: {}
}

export default IconButton
