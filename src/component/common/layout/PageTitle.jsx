import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const PageTitle = props => {
  return (
    <div className={classnames(props.parentClass, props.customClass, 'pageTitleGeneric')}>
      <div className={classnames(`${props.parentClass}__title`, 'pageTitleGeneric__title d-flex align-items-center')}>
        <div className='pageTitleGeneric__title__icon mr-3'>
          <i className='fa fa-fw fa-th' />
        </div>
        {props.title}
      </div>
      {props.children}
    </div>
  )
}

PageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  parentClass: PropTypes.string,
  customClass: PropTypes.string
}

PageTitle.defaultProps = {
  parentClass: '',
  customClass: ''
}

export default PageTitle
