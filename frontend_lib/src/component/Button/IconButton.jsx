import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import { darkenColor } from '../../helper.js'

require('./IconButton.styl')

const IconButton = props => {
  const classes = [
    `iconbutton-${props.intent}-${props.mode}`,
    `iconbutton-${props.intent}`,
    `iconbutton-${props.mode}`,
    'iconbutton',
    'btn'
  ]
  const className = classnames(classes, { [props.customClass]: props.customClass })

  const style = {
    '--primaryColor': props.color,
    '--primaryDarkColor': darkenColor(props.color)
  }
  return (
    <button
      className={className}
      style={style}
      type={props.type}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title || props.text}
      data-cy={props.dataCy}
      tabIndex={props.tabIndex}
    >
      {props.icon && (
        <i
          className={`fa-fw ${props.icon} iconbutton__icon`}
          style={{
            color: props.iconColor
          }}
        />
      )}

      {props.text && (
        <span
          className={`${props.icon ? 'iconbutton__text_with_icon' : ''} iconbutton__label`}
        >
          {props.text}
        </span>
      )}

      {props.textMobile && (
        <span
          className={`${props.icon ? 'iconbutton__text_with_icon' : ''} iconbutton__label-mobile`}
        >
          {props.textMobile}
        </span>
      )}
    </button>
  )
}

IconButton.propTypes = {
  text: PropTypes.string,
  textMobile: PropTypes.string,
  icon: PropTypes.string,
  iconColor: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
  color: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  intent: PropTypes.oneOf(['primary', 'secondary', 'link', 'pins']),
  mode: PropTypes.oneOf(['dark', 'light']),
  customClass: PropTypes.string,
  dataCy: PropTypes.string,
  tabIndex: PropTypes.string
}

IconButton.defaultProps = {
  text: undefined,
  textMobile: '',
  icon: undefined,
  iconColor: undefined,
  onClick: undefined,
  disabled: false,
  title: undefined,
  type: 'button',
  color: GLOBAL_primaryColor,
  intent: 'secondary',
  customClass: '',
  mode: 'dark',
  dataCy: undefined,
  tabIndex: '0'
}

export default IconButton
