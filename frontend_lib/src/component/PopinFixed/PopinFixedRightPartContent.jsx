import React from 'react'
import PropTypes from 'prop-types'

const PopinFixedRightPartContent = props => {
  return (
    <div className='wsContentGeneric__content__right__content'>
      {props.showTitle && (
        <div className='wsContentGeneric__content__right__content__title'>
          {props.label}
        </div>
      )}
      {props.children}
    </div>
  )
}
export default PopinFixedRightPartContent

PopinFixedRightPartContent.propTypes = {
  label: PropTypes.string,
  showTitle: PropTypes.bool
}

PopinFixedRightPartContent.defaultProps = {
  label: '',
  showTitle: true
}
