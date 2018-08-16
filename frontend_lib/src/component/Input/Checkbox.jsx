import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const style = {
  label: {
    position: 'relative',
    width: '18px',
    height: '18px',
    border: '1px solid #999',
    borderRadius: '3px',
    backgroundColor: '#eee',
    cursor: 'pointer'
  },
  checked: {
    position: 'absolute',
    top: '-3px',
    left: '2px',
    fontSize: '18px',
    color: '#333'
  },
  input: {
    width: '0',
    height: '0',
    visibility: 'hidden'
  },
  disabled: {
    cursor: 'default'
  }
}

export const Checkbox = props =>
  <label
    className={classnames('checkboxCustom', {'checked': props.checked})}
    style={{
      ...style.label,
      ...(props.disabled ? style.disabled : {})
    }}
    onClick={props.onClickCheckbox}
  >
    { props.checked && <div className='checboxCustom__checked' style={style.checked}>✔</div> }
    <input
      type='checkbox'
      name={`checkbox-${props.name}`}
      checked={props.checked}
      defaultChecked={props.defaultChecked}
      onChange={() => {}} // to remove warning
      style={style.input}
      disabled={props.disabled}
    />
  </label>

Checkbox.propTypes = {
  name: PropTypes.string.isRequired,
  onClickCheckbox: PropTypes.func.isRequired,
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  disabled: PropTypes.bool
}

Checkbox.defaultProps = {
  checked: false,
  disabled: false
}

export default Checkbox
