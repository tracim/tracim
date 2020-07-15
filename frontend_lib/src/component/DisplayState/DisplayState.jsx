import React from 'react'
import PropTypes from 'prop-types'

const DisplayState = props => (
  <div
    className='displaystate'
    data-cy='displaystate'
  >
    <div className='displaystate__msg'>
      <i className={`fa fa-fw fa-${props.icon}`} />
      {props.msg}
    </div>

    {props.btnType === 'button' && (
      <button
        className='displaystate__btn'
        onClick={props.onClickBtn}
        title={props.tooltip}
      >
        <i className={`fa fa-fw fa-${props.icon}`} />
        {props.btnLabel}
      </button>
    )}

    {props.btnType === 'link' && (
      <span
        className='displaystate__btn link'
        onClick={props.onClickBtn}
      >
        {props.btnLabel}
      </span>
    )}
  </div>
)

export default DisplayState

DisplayState.propTypes = {
  msg: PropTypes.string,
  btnType: PropTypes.oneOf([
    'button', 'link'
  ]),
  icon: PropTypes.string,
  btnLabel: PropTypes.string,
  onClickBtn: PropTypes.func,
  tooltip: PropTypes.string
}

DisplayState.defaultProps = {
  msg: '',
  icon: '',
  btnLabel: '',
  onClickBtn: () => {},
  tooltip: ''
}
