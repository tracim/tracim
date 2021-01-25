import React from 'react'
import PropTypes from 'prop-types'

import { darkenColor } from '../../helper.js'

require('./IconButton.styl')

const IconButton = props => {
  const classes = [
    `iconbutton__${props.intent}_${props.mode}`,
    'iconbutton__' + props.intent,
    'iconbutton__' + props.mode,
    'iconbutton'
  ]
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
      {props.icon && <i className={`fa fa-fw fa-${props.icon} iconbutton__icon`} />}
      {props.text && <span className='iconbutton__text'>{props.text}</span>}
    </button>
  )
}

IconButton.propTypes = {
  text: PropTypes.string,
  icon: PropTypes.string,
  title: PropTypes.string,
  color: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  intent: PropTypes.oneOf(['primary', 'secondary', 'link', 'pins']),
  mode: PropTypes.oneOf(['dark', 'light']),
  customClass: PropTypes.string,
  dataCy: PropTypes.string
}

IconButton.defaultProps = {
  text: undefined,
  icon: undefined,
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
