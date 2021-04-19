import React from 'react'
import PropTypes from 'prop-types'

const Icon = props => (
  <i
    title={props.title}
    className={`icon ${props.icon} ${props.customClass}`}
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
  customClass: '',
  color: '#252525' // INFO - G.B. - 20210211 - Default font color
}

export default Icon
