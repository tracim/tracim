import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

const PopinFixedContent = props => {
  return props.children.length === 2
    ? (
      <div className={classnames('wsFileGeneric__content', `${props.customClass}__content`)}>
        <div className={classnames('wsFileGeneric__content__left', `${props.customClass}__content__left`)}>
          {props.children[0]}
        </div>

        <div className={classnames('wsFileGeneric__content__right', `${props.customClass}__content__right`)}>
          {props.children[1]}
        </div>
      </div>
    )
    : (
      <div className={classnames('wsFileGeneric__content', `${props.customClass}__content`)}>
        { props.children }
      </div>
    )
}

export default PopinFixedContent

PopinFixedContent.propTypes = {
  customClass: PropTypes.string,
  children: PropTypes.arrayOf((children, key, componentName /* , location, propFullName */) =>
    children.length !== 2 && new Error(`PropType Error: ${componentName} must have 2 children.`)
  ).isRequired
}
