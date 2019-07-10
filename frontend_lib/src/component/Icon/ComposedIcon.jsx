import React from 'react'
import PropTypes from 'prop-types'

const ComposedIcon = props =>
  <i
    className={`composedIcon ${props.customClass} fa fa-fw fa-${props.icon}`}
    style={{...props.style}}
  >
    <i
      className={`composedIcon__subIcon ${props.smallIconCustomClass} fa fa-${props.smallIcon}`}
      style={{...props.smallIconStyle}}
    />
  </i>

ComposedIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  smallIcon: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  smallIconCustomClass: PropTypes.string,
  style: PropTypes.object,
  smallIconStyle: PropTypes.object
}

ComposedIcon.defaultProps = {
  customClass: '',
  smallIconCustomClass: '',
  style: {},
  smallIconStyle: {}
}

export default ComposedIcon
