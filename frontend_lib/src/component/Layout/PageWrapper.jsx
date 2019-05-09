import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import PageTitle from './PageTitle.jsx'
import PageContent from './PageContent.jsx'

const PageWrapper = props => {
  return (
    <div className={classnames(props.customClass, 'pageWrapperGeneric')}>
      {props.children}
    </div>
  )
}

export default PageWrapper

PageWrapper.propTypes = {
  customClass: PropTypes.string,
  children: PropTypes.arrayOf((children, key, componentName /* , location, propFullName */) => {
    if (
      children.length > 2 ||
      children[0].type !== PageTitle ||
      children[1].type !== PageContent
      // children.some(p => p.type !== CardHeader && p.type !== CardBody)
    ) {
      return new Error(`PropType Error: childrens of ${componentName} must be: 1 PageTitle and 1 PageContent.`)
    }
  }).isRequired
}

PageWrapper.defaultProps = {
  customClass: ''
}
