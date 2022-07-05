import React from 'react'
import PropTypes from 'prop-types'

import { darkenColor } from '../../helper.js'

require('./LinkButton.styl')

const LinkButton = props => {
  const style = {
    '--primaryColor': props.color,
    '--primaryDarkColor': darkenColor(props.color)
  }

  return (
    <button
      className='linkButton'
      style={style}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.text}
    >

      <span
        className='linkButton__label'
      >
        {props.text}
      </span>
    </button>
  )
}

LinkButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  color: PropTypes.string,
  disabled: PropTypes.bool
}

LinkButton.defaultProps = {
  color: GLOBAL_primaryColor,
  disabled: false
}

export default LinkButton
