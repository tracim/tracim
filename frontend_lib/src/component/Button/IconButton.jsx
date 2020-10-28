import React from 'react'
import PropTypes from 'prop-types'

import { darkenColor } from '../../helper.js'

require('../../css/IconButton.styl')

const IconButton = props => {
  const classes = ['iconbutton']
  classes.push('iconbutton__' + props.mode)
  classes.push('iconbutton__' + props.intent)
  classes.push(`iconbutton__${props.intent}_${props.mode}`)
  if (props.customClass) classes.push(props.customClass)
  const className = classes.join(' ')

  const style = {
    '--primaryColor': props.color,
    '--primaryDarkColor': darkenColor(props.color)
  }
  return (
    <button
      className={className}
      style={style}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title || props.text}
      data-cy={props.dataCy}
    >
      <i className={`fa fa-fw fa-${props.icon}`} /> <span className='iconbutton__text'>{props.text}</span>
    </button>
  )
}

IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  title: PropTypes.string,
  color: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  intent: PropTypes.oneOf(['primary', 'secondary']),
  mode: PropTypes.oneOf(['dark', 'light']),
  customClass: PropTypes.string,
  dataCy: PropTypes.string
}

IconButton.defaultProps = {
  onClick: undefined,
  disabled: false,
  title: undefined,
  color: GLOBAL_primaryColor,
  intent: 'secondary',
  customClass: '',
  mode: 'dark',
  dataCy: undefined
}

export default IconButton
