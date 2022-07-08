import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

// require('./BtnSwitch.styl') // see https://github.com/tracim/tracim/issues/1156

export const BtnSwitch = props =>
  <div
    className={classnames('btnswitch', { disabled: props.disabled, smallSize: props.smallSize, rightAligned: props.isRightAligned })}
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
      <span className={classnames('slider round', { primaryColorBg: props.checked, defaultBg: !props.checked, disabled: props.disabled })} />
    </label>
    <div className={classnames('btnswitch__text', { disabled: props.disabled })}>
      {props.checked ? props.activeLabel : props.inactiveLabel}
    </div>
  </div>

export default BtnSwitch

BtnSwitch.propTypes = {
  activeLabel: PropTypes.string,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  inactiveLabel: PropTypes.string,
  isRightAligned: PropTypes.bool,
  onChange: PropTypes.func,
  smallSize: PropTypes.bool
}

BtnSwitch.defaultProps = {
  activeLabel: '',
  checked: false,
  disabled: false,
  inactiveLabel: '',
  isRightAligned: false,
  onChange: () => {},
  smallSize: false
}
