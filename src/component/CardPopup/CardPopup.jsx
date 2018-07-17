import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

require('./CardPopup.styl')

const CardPopup = props => {
  return (
    <div className={classnames(props.customClass, 'cardPopup')}>
      <div className='cardPopup__container'>
        <div className='cardPopup__header' style={{backgroundColor: props.customColor}} />

        <div className='cardPopup__close' onClick={props.onClose}>
          <i className='fa fa-times' />
        </div>

        <div className='cardPopup__body'>
          { props.children }
        </div>
      </div>
    </div>
  )
}

export default CardPopup

CardPopup.propTypes = {
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  onClose: PropTypes.func
}

CardPopup.defaultProps = {
  customClass: 'defaultCustomClass',
  customColor: '',
  onClose: () => {}
}
