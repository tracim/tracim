import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

require('./InputGroupText.styl')

const InputGroupText = props => {
  return (
    <div className={classnames(`inputGroupText ${props.parentClassName}`, props.customClass, 'form-group')} data-cy={props.dataCy}>
      {props.icon !== '' && <i className={classnames('inputGroupText__icon fas fa-fw', props.icon)} />}
      <input
        type={props.type}
        className={classnames(`inputGroupText__input ${props.parentClassName}__input`, 'form-control', { 'is-invalid': props.isInvalid })}
        placeholder={props.placeHolder}
        value={props.value}
        onChange={props.onChange}
        onKeyDown={props.onKeyDown}
        maxLength={props.maxLength}
        name={props.name}
      />
      <div className={classnames(`${props.parentClassName}__msgerror`, 'invalid-feedback')}>
        {props.invalidMsg}
      </div>
    </div>
  )
}

export default InputGroupText

InputGroupText.propTypes = {
  parentClassName: PropTypes.string.isRequired,
  value: PropTypes.string,
  type: PropTypes.oneOf(['text', 'email', 'password', 'tel']).isRequired,
  customClass: PropTypes.string,
  icon: PropTypes.string,
  placeHolder: PropTypes.string,
  invalidMsg: PropTypes.string,
  isInvalid: PropTypes.bool,
  onChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  maxLength: PropTypes.number,
  name: PropTypes.string,
  dataCy: PropTypes.string
}

InputGroupText.defaultProps = {
  customClass: '',
  icon: '',
  placeHolder: '',
  invalidMsg: '',
  isInvalid: false,
  onChange: () => {},
  onKeyDown: () => {},
  maxLength: 512,
  name: '',
  dataCy: ''
}
