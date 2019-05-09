import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs.jsx'

const PageTitle = props => {
  return (
    <div className={classnames(props.parentClass, props.customClass, 'pageTitleGeneric')}>
      <div className={classnames(`${props.parentClass}__title`, 'pageTitleGeneric__title')}>
        <div className='pageTitleGeneric__title__icon'>
          <i className={`fa fa-fw fa-${props.icon}`} />
        </div>

        {props.title}
      </div>

      {props.breadcrumbsList.length > 0
        ? <Breadcrumbs breadcrumbsList={props.breadcrumbsList} />
        : <div />
      }

      {props.subtitle}

      {props.children}
    </div>
  )
}

PageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  parentClass: PropTypes.string,
  customClass: PropTypes.string,
  icon: PropTypes.string,
  breadcrumbsList: PropTypes.array
}

PageTitle.defaultProps = {
  parentClass: '',
  customClass: '',
  icon: '',
  subtitle: '',
  breadcrumbsList: []
}

export default PageTitle
