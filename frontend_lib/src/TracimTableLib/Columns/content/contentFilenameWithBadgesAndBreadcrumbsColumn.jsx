import React from 'react'
import classnames from 'classnames'
import { createColumnHelper } from '@tanstack/react-table'

import Breadcrumbs from '../../../component/Breadcrumbs/Breadcrumbs.jsx'
import FilenameWithBadges from '../../../component/FilenameWithBadges/FilenameWithBadges.jsx'
import Icon from '../../../component/Icon/Icon.jsx'

const contentFilenameWithBadgesAndBreadcrumbsColumn = (settings, t) => {
  const columnHelper = createColumnHelper()
  console.log(settings)
  return columnHelper.accessor(row => {
    const breadcrumbs = row.breadcrumbs ? row.breadcrumbs.map(b => b.label).join('') : ''
    return `${row.originalLabel} ${breadcrumbs}`
  }, {
    header: () => (
      <span>{settings.header}</span>
    ),
    id: settings.id,
    cell: props => {
      if (props.row.original.content) {
        return (
          <div className='contentFilenameColumn__name_path'>
            <FilenameWithBadges file={props.row.original.content} />
            <Breadcrumbs
              breadcrumbsList={props.row.original.breadcrumbs}
              keepLastBreadcrumbAsLink
            />
          </div>
        )
      }
      return (
        <div className='contentFilenameColumn__name_path contentFilenameColumn__unavailableContent__name_warning'>
          <span>{props.row.original.originalLabel}</span>
          <span className='contentFilenameColumn__unavailableContent__warning'>
            <Icon
              icon='fas fa-exclamation-triangle'
              title={t('Warning')}
            />
            &nbsp;
            {t('content is not available')}
          </span>
        </div>
      )
    },
    className: settings.className,
    style: classnames(settings.style),
    filterFn: 'includesString',
    sortingFn: 'alphanumeric'
  })
}

export default contentFilenameWithBadgesAndBreadcrumbsColumn
