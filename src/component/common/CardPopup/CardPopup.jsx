import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

require('./CardPopup.styl')

const CardPopup = props => {
  return (
    <div className={classnames(props.customClass, 'cardPopup')}>
      <div className='cardPopup__container'>
        <div className='cardPopup__header' />

        <div className='nopadding'>
          <div className='cardPopup__close' onClick={props.onClose}>
            <i className='fa fa-times' />
          </div>

          <div className='cardPopup__body'>
            <div className='cardPopup__body__icon'>
              <i className={props.icon} />
            </div>

            <div className='cardPopup__body__text'>
              <div className='cardPopup__body__text__title'>
                {props.title}
              </div>
              <div className='cardPopup__body__text__message'>
                {props.message}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardPopup

CardPopup.propTypes = {
  customClass: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.string,
  onClose: PropTypes.func
}

CardPopup.defaultProps = {
  customClass: 'defaultCustomClass',
  title: 'Default title',
  message: 'Default message',
  icon: 'fa fa-times-circle',
  onClose: () => {}
}
