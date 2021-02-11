import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

// require('./CardPopup.styl') // see https://github.com/tracim/tracim/issues/1156

const CardPopup = props => {
  return (
    <div
      className={classnames(props.customClass, 'cardPopup')}
      style={props.customStyle}
    >
      <div className='cardPopup__container'>
        <div className={classnames(props.customHeaderClass, 'cardPopup__header')} style={{ backgroundColor: props.customColor }} />

        {props.hideCloseBtn === false &&
          <div className='cardPopup__close' onClick={props.onClose}>
            <i className='fas fa-times' />
          </div>}

        <div className='cardPopup__body'>
          {props.children}
        </div>
      </div>
    </div>
  )
}

export default CardPopup

CardPopup.propTypes = {
  customClass: PropTypes.string,
  customHeaderClass: PropTypes.string,
  customColor: PropTypes.string,
  onClose: PropTypes.func,
  hideCloseBtn: PropTypes.bool,
  customStyle: PropTypes.object
}

CardPopup.defaultProps = {
  customClass: 'defaultCustomClass',
  customHeaderClass: '',
  customColor: '',
  onClose: () => {},
  hideCloseBtn: false,
  customStyle: {}
}
