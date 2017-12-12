import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const Card = props => {
  return (
    <div className={classnames(props.customClass, 'card')}>
      {props.children}
    </div>
  )
}
export default Card

Card.PropTypes = {
  children: PropTypes.element.isRequired,
  customClass: PropTypes.string
}

Card.defaultProps = {
  customClass: ''
}
