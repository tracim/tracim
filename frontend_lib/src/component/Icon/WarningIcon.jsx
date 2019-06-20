import React from 'react'
import PropTypes from 'prop-types'

const WarningIcon = props =>
  <i className={`warningicon ${props.customClass} fa fa-fw fa-${props.icon}`} style={props.style}>
    <i className={`warningicon__warning fa fa-warning text-danger`} />
  </i>

WarningIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  style: PropTypes.object
}

WarningIcon.defaultProps = {
  customClass: '',
  style: {}
}

export default WarningIcon
