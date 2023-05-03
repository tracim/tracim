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
  title: PropTypes.string.isRequired,
  color: PropTypes.string,
  customClass: PropTypes.string,
  icon: PropTypes.string
}

Icon.defaultProps = {
  color: '',
  customClass: '',
  icon: 'fas fa-question'
}

export default Icon
