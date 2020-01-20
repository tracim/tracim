import React from 'react'
import PropTypes from 'prop-types'

const ComposedIcon = props =>
  <i
    className={`composedIcon ${props.mainIconCustomClass} fa fa-fw fa-${props.mainIcon}`}
    style={{ ...props.mainIconStyle }}
  >
    <i
      className={`composedIcon__subIcon ${props.smallIconCustomClass} fa fa-${props.smallIcon}`}
      style={{ ...props.smallIconStyle }}
    />
  </i>

ComposedIcon.propTypes = {
  mainIcon: PropTypes.string.isRequired,
  smallIcon: PropTypes.string.isRequired,
  mainIconCustomClass: PropTypes.string,
  smallIconCustomClass: PropTypes.string,
  mainIconStyle: PropTypes.object,
  smallIconStyle: PropTypes.object
}

ComposedIcon.defaultProps = {
  mainIconCustomClass: '',
  smallIconCustomClass: '',
  mainIconStyle: {},
  smallIconStyle: {}
}

export default ComposedIcon
