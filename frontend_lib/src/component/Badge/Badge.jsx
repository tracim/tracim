import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

// require('Badge.styl') // see https://github.com/tracim/tracim/issues/1156

const Badge = props =>
  <span
    className={classnames('badge', props.customClass)}
    style={{ ...props.style }}
  >
    {props.text}
  </span>

Badge.propTypes = {
  text: PropTypes.string,
  customClass: PropTypes.string,
  style: PropTypes.object
}

Badge.defaultProps = {
  text: '',
  customClass: '',
  style: {}
}

export default Badge
