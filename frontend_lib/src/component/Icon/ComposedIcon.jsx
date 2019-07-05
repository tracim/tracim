import React from 'react'
import PropTypes from 'prop-types'

const ComposedIcon = props =>
  <i className={`composedIcon ${props.customClass} fa fa-fw fa-${props.icon}`} >
    <i className={`composedIcon__subIcon ${props.smallIconCustomClass} fa fa-${props.smallIcon}`} />
  </i>

ComposedIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  smallIcon: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  smallIconCustomClass: PropTypes.string
}

ComposedIcon.defaultProps = {
  customClass: '',
  smallIconCustomClass: ''
}

export default ComposedIcon
