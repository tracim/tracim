import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

require('./Breadcrumbs.styl')

export const Breadcrumbs = props => {
  const MAX_NUMBER_OF_LEVELS = 6
  const LAST_VISIBLE_LEVELS = 3
  let breadcrumbsList = [...props.breadcrumbsList]

  if (props.breadcrumbsList.length >= MAX_NUMBER_OF_LEVELS) {
    breadcrumbsList = [
      props.breadcrumbsList[0],
      {
        label: '…',
        htmlTitle: props.breadcrumbsList.map(crumb => crumb.label).join(' > '),
        link: '',
        isALink: false
      },
      ...props.breadcrumbsList.slice(Math.max(props.breadcrumbsList.length - LAST_VISIBLE_LEVELS, 0))
    ]
  }

  // NOTE - S.G. - 2020-12-17 - convert the last breadcrumb to a span if not specified otherwise
  if (!props.keepLastBreadcrumbAsLink && breadcrumbsList.length > 0) {
    const lastBreadcrumb = {
      ...breadcrumbsList[breadcrumbsList.length - 1],
      link: '',
      isALink: false
    }
    breadcrumbsList[breadcrumbsList.length - 1] = lastBreadcrumb
  }

  return (
    <div>
      <ul className={classnames('breadcrumbs', { hidden: props.hidden })}>
        {props.root && (props.root.isALink
          ? (
            <li className='breadcrumbs__item' key='root'>
              <Link
                to={props.root.link}
                className='root primaryColorFont primaryColorFontDarkenHover'
              >
                {props.root.icon && <i className={`${props.root.icon}`} />}
                <span className='breadcrumbs__item__text'>{props.root.label}&nbsp;</span>
              </Link>&gt;&nbsp;
            </li>
          )
          : (
            <li>
              <div>
                {props.root.icon && <i className={`fas fa-${props.root.icon}`} />}
                {props.root.label}
              </div>
            </li>
          )
        )}

        {breadcrumbsList.map((crumb, i) =>
            <li
              className='breadcrumbs__item'
              key={`breadcrumbs_${i}`}
              title={crumb.htmlTitle || crumb.label || ''}
            >
                {(crumb.isALink
                  ? <Link to={crumb.link} className='primaryColorFont primaryColorFontDarkenHover'>
                      <div className='breadcrumbs__item__label'>{crumb.label}</div>
                    </Link>
                  : <div className='breadcrumbs__item__label'>{crumb.label}</div>
                )}
                {i !== breadcrumbsList.length - 1 && (
                  <div className='breadcrumbs__item__separator'>&gt;</div>
                )}
            </li>
        )}
      </ul>
    </div>
  )
}

export default Breadcrumbs

Breadcrumbs.propTypes = {
  hidden: PropTypes.bool,
  root: PropTypes.object,
  breadcrumbsList: PropTypes.array.isRequired,
  keepLastBreadcrumbAsLink: PropTypes.bool
}

Breadcrumbs.defaultProps = {
  keepLastBreadcrumbAsLink: false
}
