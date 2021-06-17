import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import PopinFixedHeader from './PopinFixedHeader.jsx'
import PopinFixedContent from './PopinFixedContent.jsx'

// require('./PopinFixed.styl') // see https://github.com/tracim/tracim/issues/1156

const PopinFixed = props => {
  return (
    <div
      className={classnames('wsContentGeneric', props.customClass, { visible: props.visible })}
      style={props.style}
      data-cy='popinFixed'
    >
      {props.children}
    </div>
  )
}

export default PopinFixed

PopinFixed.propTypes = {
  // from http://www.mattzabriskie.com/blog/react-validating-children
  children: PropTypes.arrayOf((children, key, componentName /* , location, propFullName */) => {
    if (
      children.length > 3 ||
      children[0].type !== PopinFixedHeader ||
      children[1].type !== PopinFixedContent
    ) {
      return new Error(`PropType Error: childrens of ${componentName} must be: 1 PopinFixedHeader and 1 PopinFixedContent.`)
    }
  }).isRequired,
  customClass: PropTypes.string,
  visible: PropTypes.bool
}

PopinFixed.defaultProps = {
  customClass: '',
  visible: true
}
