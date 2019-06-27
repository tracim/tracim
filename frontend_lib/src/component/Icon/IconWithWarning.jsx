import React from 'react'
import PropTypes from 'prop-types'

const IconWithWarning = props =>
  <i className={`iconWithWarning ${props.customClass} fa fa-fw fa-${props.icon}`} style={props.style}>
    <i className={`iconWithWarning__subIcon fa fa-warning text-danger`} />
  </i>

IconWithWarning.propTypes = {
  icon: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  style: PropTypes.object
}

IconWithWarning.defaultProps = {
  customClass: '',
  style: {}
}

export default IconWithWarning
