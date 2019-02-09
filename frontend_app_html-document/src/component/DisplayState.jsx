import React from 'react'
import PropTypes from 'prop-types'

const DisplayState = props => (
  <div className='html-document__contentpage__textnote__state'>
    <div className='html-document__contentpage__textnote__state__msg'>
      <i className={`fa fa-fw fa-${props.icon}`} />
      {props.msg}
    </div>

    {props.type === 'button' && (
      <button
        className='html-document__contentpage__textnote__state__btnrestore'
        onClick={props.onClickBtn}
      >
        <i className={`fa fa-fw fa-${props.icon}`} />
        {props.btnLabel}
      </button>
    )}

    {props.type === 'link' && (
      <span
        className='html-document__contentpage__textnote__state__btnrestore link'
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
  type: PropTypes.string,
  icon: PropTypes.string,
  btnLabel: PropTypes.string,
  onClickBtn: PropTypes.func
}

DisplayState.defaultState = {
  msg: '',
  type: '',
  icon: '',
  btnLabel: '',
  onClickBtn: () => {}
}
