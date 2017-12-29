import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
// import PageHtml from '../../../plugin/ContentType/PageHtml/PageHtml.jsx'
// import Thread from '../../../plugin/ContentType/Thread/Thread.jsx'
// import Timeline from '../../Timeline.jsx'

const PopinFixedContent = props => {
  return props.children.length === 2
    ? (
      <div className={classnames('wsFileGeneric__contentpage', `${props.customClass}`)}>
        {props.children[0]}

        <div className={classnames('wsFileGeneric__wrapper', `${props.customClass}__wrapper`)}>
          {props.children[1]}
        </div>
      </div>
    )
    : (
      <div className={classnames('wsFileGeneric__contentpage', `${props.customClass}`)}>
        { props.children }
      </div>
    )
}

export default PopinFixedContent

PopinFixedContent.propTypes = {
  customClass: PropTypes.string

  // from http://www.mattzabriskie.com/blog/react-validating-children
  // children: PropTypes.arrayOf((children, key, componentName /* , location, propFullName */) => {
  //   if (
  //     (Array.isArray(children.length) && (
  //       children.length > 2 ||
  //       (children.length === 2 && children.some(c => ![PageHtml, Thread, Timeline].includes(c.type)))
  //     )) ||
  //     (children.type === Timeline)
  //   ) {
  //     return new Error(`PropType Error: childrens of ${componentName} must be one of [PageHtml, Thread, Timeline, undefined].`)
  //   }
  // }).isRequired
}
