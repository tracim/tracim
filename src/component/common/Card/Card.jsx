import React from 'react'
import PropTypes from 'prop-types'

const Card = props => {
  return (
    <div className='loginpage__content__connection card'>
      {props.children}
    </div>
  )
}
export default Card

Card.PropTypes = {
  children: PropTypes.element.isRequired
}
