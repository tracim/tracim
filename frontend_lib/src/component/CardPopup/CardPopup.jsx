import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import CloseButton from '../Button/CloseButton.jsx'

// require('./CardPopup.styl') // see https://github.com/tracim/tracim/issues/1156

const CardPopup = props => {
  return (
    <div
      className={classnames(props.customClass, 'cardPopup')}
      style={props.customStyle}
    >
      <div className='cardPopup__container'>
        <div className={classnames(props.customHeaderClass, 'cardPopup__border')} style={{ backgroundColor: props.customColor }} />

        <div className='cardPopup__header'>
          {props.label && (
            <div className='cardPopup__header__title'>
              <div className='cardPopup__header__title__icon'>
                <i
                  className={`${props.faIcon}`}
                  style={{ color: props.customColor }}
                  title={props.label}
                />
              </div>

              {props.label}
            </div>
          )}

          {props.hideCloseBtn === false && (
            <div className='cardPopup__header__close'>
              <CloseButton onClick={props.onClose} />
            </div>
          )}
        </div>

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
  onClose: () => { },
  hideCloseBtn: false,
  customStyle: {}
}
