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
  // from http://www.mattzabriskie.com/blog/react-validating-children
  children: PropTypes.arrayOf((children, key, componentName /* , location, propFullName */) => {
    if (
      children.length > 2 ||
      children[0].type !== CardHeader ||
      children[1].type !== CardBody
      // children.some(p => p.type !== CardHeader && p.type !== CardBody)
    ) {
      return new Error(`PropType Error: children of ${componentName} must be: 1 CardHeader and 1 CardBody.`)
    }
  }).isRequired,
  customClass: PropTypes.string
}

Card.defaultProps = {
  customClass: ''
}
