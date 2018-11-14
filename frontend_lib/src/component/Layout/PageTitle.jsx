import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const PageTitle = props => {
  return (
    <div className={classnames(props.parentClass, props.customClass, 'pageTitleGeneric')}>
      <div className={classnames(`${props.parentClass}__title`, 'pageTitleGeneric__title d-flex align-items-center')}>
        <div className='pageTitleGeneric__title__icon mr-3'>
          <i className={`fa fa-fw fa-${props.icon} mr-3`} />
          {props.title}
        </div>
        {props.subtitle}
      </div>
      {props.children}
    </div>
  )
}

PageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  parentClass: PropTypes.string,
  customClass: PropTypes.string,
  icon: PropTypes.string
}

PageTitle.defaultProps = {
  parentClass: '',
  customClass: '',
  icon: '',
  subtitle: ''
}

export default PageTitle
