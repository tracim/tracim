import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import { BREADCRUMBS_TYPE, PAGE } from '../../helper.js'
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs.jsx'
import Popover from '../Popover/Popover.jsx'

export const PageTitle = (props) => {
  const title = props.t('Home')

  const breadcrumbsRoot = {
    link: PAGE.HOME,
    label: title,
    icon: 'fas fa-home',
    type: BREADCRUMBS_TYPE.CORE,
    isALink: true
  }

  return (
    <div className={classnames(props.parentClass, props.customClass, 'pageTitleGeneric')}>
      <div
        className={classnames(`${props.parentClass}__title`, 'pageTitleGeneric__title')}
        data-cy='layoutPageTitle'
      >
        <div className='pageTitleGeneric__title__icon' title={props.iconTooltip}>
          <i className={`fa-fw ${props.icon}`} />
        </div>

        <div className='pageTitleGeneric__title__label' id='popoverPageTitle'>
          {props.title}
        </div>
        <Popover
          targetId='popoverPageTitle'
          popoverBody={props.title}
        />
      </div>

      {(props.breadcrumbsList.length > 0
        ? <Breadcrumbs root={breadcrumbsRoot} breadcrumbsList={props.breadcrumbsList} />
        : <div />
      )}

      {props.subtitle.length > 0 && (
        <div
          className={classnames(`${props.parentClass}__subtitle`, 'pageTitleGeneric__subtitle')}
          data-cy='layoutPageSubTitle'
        >
          {props.subtitle}
        </div>
      )}

      {props.children}
    </div>
  )
}
export default translate()(PageTitle)

PageTitle.propTypes = {
  breadcrumbsList: PropTypes.array.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  subtitle: PropTypes.string,
  parentClass: PropTypes.string,
  customClass: PropTypes.string,
  icon: PropTypes.string,
  iconTooltip: PropTypes.string
}

PageTitle.defaultProps = {
  parentClass: '',
  customClass: '',
  icon: '',
  subtitle: '',
  iconTooltip: ''
}
