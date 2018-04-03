import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const CardHeader = props => {
  return (
    <div className={classnames('card-header', props.customClass)}>
      {props.children}
    </div>
  )
}

export default CardHeader

CardHeader.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.string
  ]).isRequired,
  customClass: PropTypes.string
}

CardHeader.defaultProps = {
  customClass: ''
}
