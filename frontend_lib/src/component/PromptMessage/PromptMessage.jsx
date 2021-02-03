import React from 'react'
import PropTypes from 'prop-types'

const PromptMessage = props => (
  <div
    className='promptMessage'
    data-cy='promptMessage'
  >
    <div className='promptMessage__msg'>
      <i className={`fa-fw ${props.icon}`} />
      {props.msg}
    </div>

    {props.btnType === 'button' && (
      <button
        className='btn promptMessage__btn'
        onClick={props.onClickBtn}
        title={props.tooltip}
      >
        <i className={`fa-fw ${props.icon}`} />
        {props.btnLabel}
      </button>
    )}

    {props.btnType === 'link' && (
      <button
        className='btn promptMessage__btn link'
        onClick={props.onClickBtn}
      >
        {props.btnLabel}
      </button>
    )}
  </div>
)

export default PromptMessage

PromptMessage.propTypes = {
  msg: PropTypes.string,
  btnType: PropTypes.oneOf([
    'button', 'link'
  ]),
  icon: PropTypes.string,
  btnLabel: PropTypes.string,
  onClickBtn: PropTypes.func,
  tooltip: PropTypes.string
}

PromptMessage.defaultProps = {
  msg: '',
  icon: '',
  btnLabel: '',
  onClickBtn: () => {},
  tooltip: ''
}
