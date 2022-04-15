import React from 'react'
import PropTypes from 'prop-types'

// require('Badge.styl') // see https://github.com/tracim/tracim/issues/1156

const Badge = props =>
  <span className='badge'>
    {props.text}
  </span>

Badge.propTypes = {
  text: PropTypes.string
}

Badge.defaultProps = {
  text: ''
}

export default Badge
