import React from 'react'
import PropTypes from 'prop-types'

export const Breadcrumbs = props => {
  const MAX_NUMBER_OF_LEVELS = 6
  const LAST_VISIBLE_LEVELS = 3
  let breadcrumbsList = [...props.breadcrumbsList]

  if (props.breadcrumbsList.length >= MAX_NUMBER_OF_LEVELS) {
    breadcrumbsList = [
      props.breadcrumbsList[0],
      {
        label: props.breadcrumbsList.map(crumb => crumb.label).join(' > '),
        link: <span>…</span>,
        notALink: true
      },
      ...props.breadcrumbsList.slice(Math.max(props.breadcrumbsList.length - LAST_VISIBLE_LEVELS, 0))
    ]
  }

  // NOTE - S.G. - 2020-12-17 - convert the last breadcrumb to a span if not specified otherwise
  if (!props.keepLastBreadcrumbAsLink && breadcrumbsList.length > 0) {
    const lastBreadcrumb = {
      ...breadcrumbsList[breadcrumbsList.length - 1],
      link: <span>{breadcrumbsList[breadcrumbsList.length - 1].label}</span>,
      notALink: true
    }
    breadcrumbsList[breadcrumbsList.length - 1] = lastBreadcrumb
  }
  return (
    <ul className='breadcrumbs'>
      {props.root && <li key='root'>{props.root}</li>}
      {breadcrumbsList.map((crumb, i) =>
        <li
          className={`breadcrumbs__item ${crumb.notALink ? '' : 'primaryColorFont primaryColorFontDarkenHover'}`}
          key={`breadcrumbs_${i}`}
          title={crumb.label || ''}
        >
          {crumb.link}
        </li>
      )}
    </ul>
  )
}

export default Breadcrumbs

Breadcrumbs.propTypes = {
  root: PropTypes.node,
  breadcrumbsList: PropTypes.array.isRequired,
  keepLastBreadcrumbAsLink: PropTypes.bool
}

Breadcrumbs.defaultProps = {
  keepLastBreadcrumbAsLink: false
}
