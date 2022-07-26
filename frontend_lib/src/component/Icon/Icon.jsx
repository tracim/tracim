import React from 'react'
import PropTypes from 'prop-types'

const Icon = props => (
  <i
    title={props.title}
    className={`fa fa-fw icon ${props.icon} ${props.customClass}`}
    style={{ color: props.color }}
  >
    {props.children}
  </i>
)

Icon.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  color: PropTypes.string,
  customClass: PropTypes.string
}

Icon.defaultProps = {
  customClass: ''
}

export default Icon
