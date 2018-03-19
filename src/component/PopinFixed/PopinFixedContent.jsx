import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

const PopinFixedContent = props => {
  return props.children.length === 2
    ? (
      <div className={classnames('wsContentGeneric__content', `${props.customClass}__content`)}>
        <div className={classnames('wsContentGeneric__content__left', `${props.customClass}__content__left`)}>
          {props.children[0]}
        </div>

        <div className={classnames('wsContentGeneric__content__right', `${props.customClass}__content__right`)}>
          {props.children[1]}
        </div>
      </div>
    )
    : (
      <div className={classnames('wsContentGeneric__content', `${props.customClass}__content`)}>
        { props.children }
      </div>
    )
}

export default PopinFixedContent

PopinFixedContent.propTypes = {
  customClass: PropTypes.string,
  children: (props, propName, componentName) => {
    if (Array.isArray(props) && props.length !== 2) {
      return new Error(`PropType Error: ${componentName} must have 1 or 2 children.`)
    } else if (typeof props !== 'object') {
      return new Error(`PropType Error: childrens of ${componentName} must have 1 or 2 children.`)
    }
  }
}
