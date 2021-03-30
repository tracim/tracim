import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

// require('./BtnSwitch.styl') // see https://github.com/tracim/tracim/issues/1156

export const BtnSwitch = props =>
  <div
    className={classnames('btnswitch', { disabled: props.disabled, smallSize: props.smallSize })}
    title={props.checked ? props.activeLabel : props.inactiveLabel}
  >
    <label
      className='switch nomarginlabel' onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        if (props.disabled) return
        props.onChange(e)
      }}
    >
      <input
        type='checkbox'
        checked={props.checked}
        onChange={e => {
          e.preventDefault()
          e.stopPropagation()
          if (props.disabled) return
          props.onChange(e)
        }}
        disabled={props.disabled}
      />
      <span className={classnames('slider round', { primaryColorBg: props.checked && !props.disabled, defaultBg: !props.checked || props.disabled })} />
    </label>
    <div className='btnswitch__text'>
      {props.checked ? props.activeLabel : props.inactiveLabel}
    </div>
  </div>

export default BtnSwitch

BtnSwitch.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  activeLabel: PropTypes.string,
  inactiveLabel: PropTypes.string,
  disabled: PropTypes.bool,
  smallSize: PropTypes.bool
}

BtnSwitch.defaultProps = {
  checked: false,
  onChange: () => {},
  activeLabel: '',
  inactiveLabel: '',
  disabled: false,
  smallSize: false
}
