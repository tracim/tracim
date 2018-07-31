import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const PageContent = props => {
  return (
    <div className={classnames(props.parentClass, props.customClass, 'pageContentGeneric')}>
      {props.children}
    </div>
  )
}

PageContent.propTypes = {
  parentClass: PropTypes.string,
  customClass: PropTypes.string
}

PageContent.defaultProps = {
  parentClass: '',
  customClass: ''
}

export default PageContent
