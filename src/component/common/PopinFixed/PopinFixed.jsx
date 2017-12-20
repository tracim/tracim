import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

const PopinFixed = props => {
  return (
    <div className={classnames('wsFileGeneric', props.customClass, {'visible': props.visible})}>
      {props.children}
    </div>
  )
}

export default PopinFixed

PopinFixed.propTypes = {
  customClass: PropTypes.string,
  visible: PropTypes.bool
}

PopinFixed.defaultProps = {
  customClass: '',
  visible: true
}
