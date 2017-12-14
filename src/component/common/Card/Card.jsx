import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import CardHeader from './CardHeader.jsx'
import CardBody from './CardBody.jsx'

const Card = props => {
  return (
    <div className={classnames(props.customClass, 'card')}>
      {props.children}
    </div>
  )
}
export default Card

Card.propTypes = {
  // check https://stackoverflow.com/questions/27366077/only-allow-children-of-a-specific-type-in-a-react-component
  // children: PropTypes.arrayOf( // children is an array
  //   PropTypes.shape({ // of objects
  //     type: PropTypes.oneOf([CardHeader, CardBody]) // that as an attribute 'type' equals to CardHeader or CardBody
  //   })
  // ),

  // from http://www.mattzabriskie.com/blog/react-validating-children
  children: PropTypes.arrayOf((propValue, key, componentName /* , location, propFullName */) => {
    if (
      key >= 3 ||
      propValue.some(p => p.type !== CardHeader && p.type !== CardBody)
    ) {
      return new Error(`PropType Error: childrens of ${componentName} must be: 1 CardHeader and 1 CardBody.`)
    }
  }).isRequired,
  customClass: PropTypes.string
}

Card.defaultProps = {
  customClass: ''
}
